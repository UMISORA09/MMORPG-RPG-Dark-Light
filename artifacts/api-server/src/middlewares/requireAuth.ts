import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/token";

export async function extractAuthUser(req: any): Promise<any | null> {
  let userId = Number(req.session?.userId);
  let tokenData: any = null;

  // If no session userId, check Authorization header (Bearer <token>) or cookie (clb_token)
  if (!Number.isInteger(userId) || userId <= 0) {
    const authHeader = req.headers?.authorization;
    let token = "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.clb_token) {
      token = req.cookies.clb_token;
    }

    if (token) {
      tokenData = verifyToken(token);
      if (tokenData?.id) {
        userId = Number(tokenData.id);
      }
    }
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  // Bảo đảm an toàn: Tuyệt đối KHÔNG tự tạo lại tài khoản đã bị xóa dựa trên token cũ!
  // Nếu tài khoản không còn trong database, token/session coi như vô hiệu.
  if (!user) {
    return null;
  }

  // Ensure session and request properties are synchronized
  if (!req.session) {
    req.session = {} as any;
  }
  req.session.userId = user.id;
  req.authUserId = user.id;
  req.authUser = user;

  return user;
}

export async function requireAuth(req: any, res: any, next: any): Promise<void> {
  const user = await extractAuthUser(req);
  if (!user) {
    if (req.session?.destroy) {
      req.session.destroy(() => undefined);
    }
    res.status(401).json({ error: "Chưa đăng nhập" });
    return;
  }
  next();
}

/**
 * Middleware phân quyền nghiêm ngặt dành cho các thao tác quản trị GM/Admin.
 * Ngăn chặn tuyệt đối người dùng thông thường gọi các lệnh GM hoặc tự cấp tài nguyên.
 */
export async function requireGMOrAdmin(req: any, res: any, next: any): Promise<void> {
  const user = await extractAuthUser(req);
  if (!user) {
    if (req.session?.destroy) {
      req.session.destroy(() => undefined);
    }
    res.status(401).json({ error: "Chưa đăng nhập" });
    return;
  }

  const gmSecret = process.env.GM_SECRET_KEY;
  const headerSecret = req.headers?.["x-gm-secret"];
  const isSecretAuthorized = Boolean(gmSecret && headerSecret && headerSecret === gmSecret);
  const userRole = (user.role || "PLAYER").toUpperCase();

  if (userRole !== "ADMIN" && userRole !== "GM" && !isSecretAuthorized) {
    res.status(403).json({
      error: "Yêu cầu quyền Quản trị viên (GM/Admin). Bạn không được phép sử dụng lệnh này.",
    });
    return;
  }

  next();
}

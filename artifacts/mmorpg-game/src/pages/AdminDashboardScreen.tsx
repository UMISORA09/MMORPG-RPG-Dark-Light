import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  Sword,
  Backpack,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Gift,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  Activity,
  Layers,
  Award,
  Coins,
  ChevronRight,
  X,
  KeyRound,
  Eye,
  Sliders,
  Terminal,
  LogOut,
  Sparkles,
  Filter,
  Check,
  AlertTriangle,
  Radio,
  Zap,
  Link2,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatsData {
  dbMode: string;
  isPostgres: boolean;
  nodeEnv: string;
  uptimeSeconds: number;
  counts: {
    users: number;
    characters: number;
    items: number;
    monsters: number;
    servers: number;
    quests: number;
    characterItems: number;
  };
}

interface UserData {
  id: number;
  username: string;
  role?: string;
  isRealUser?: boolean;
  isDummy?: boolean;
  forumTitle: string;
  selectedRegion: string;
  selectedServerId: string;
  createdAt: string;
  characterCount: number;
  characters: Array<{
    id: number;
    name: string;
    className: string;
    level: number;
    gold: number;
  }>;
}

interface AuditItem {
  id: string;
  name: string;
  source: string;
  suggestedCategory: string;
  suggestedRarity: string;
  suggestedSlot: string;
  icon: string;
}

interface AuditResult {
  totalRegistered: number;
  totalReferenced: number;
  missingCount: number;
  healthStatus: "PERFECT" | "MISSING_DATA";
  missingItems: AuditItem[];
}

interface CharacterData {
  id: number;
  userId: number;
  username: string;
  name: string;
  classId: string;
  className: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  gold: number;
  combatPower: number;
  serverId: string;
  title: string;
  zoneId: string;
}

interface ItemData {
  id: string;
  name: string;
  type: string;
  category: string;
  equipSlot?: string;
  rarity: string;
  hpBoost: number;
  atkBoost: number;
  defBoost: number;
  spdBoost: number;
  price: number;
  requiredLevel: number;
  icon: string;
  description: string;
}

interface TableInfo {
  name: string;
  description: string;
  rowCount: number;
}

export default function AdminDashboardScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof window !== "undefined" && sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [passcode, setPasscode] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "characters" | "items" | "db">("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Non-blocking custom Dark Fantasy Confirmation Dialog (Eliminates INP blockage)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    confirmVariant?: "cyan" | "danger";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Xác Nhận",
    confirmVariant: "cyan",
    onConfirm: () => {},
  });

  // Users state
  const [users, setUsers] = useState<UserData[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "real" | "dummy">("all");
  const [userCounts, setUserCounts] = useState<{ total: number; real: number; dummy: number }>({
    total: 0,
    real: 0,
    dummy: 0,
  });
  const [userModal, setUserModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: UserData }>({
    open: false,
    mode: "create",
  });
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    forumTitle: "Tân Thủ Long Tộc",
    selectedServerId: "s1_long_vuong",
  });

  // Characters state
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [charPage, setCharPage] = useState(1);
  const [charSearch, setCharSearch] = useState("");
  const [charModal, setCharModal] = useState<{ open: boolean; mode: "create" | "edit" | "grant"; data?: CharacterData }>({
    open: false,
    mode: "edit",
  });
  const [charForm, setCharForm] = useState<Partial<CharacterData>>({});
  const [grantForm, setGrantForm] = useState({ itemId: "", quantity: 1, enhanceLevel: 0 });
  const [charItemsModal, setCharItemsModal] = useState<{ open: boolean; char?: CharacterData; items: any[] }>({
    open: false,
    items: [],
  });

  // Items state
  const [items, setItems] = useState<ItemData[]>([]);
  const [itemPage, setItemPage] = useState(1);
  const [itemSearch, setItemSearch] = useState("");
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [itemModal, setItemModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: ItemData }>({
    open: false,
    mode: "create",
  });
  const [itemForm, setItemForm] = useState<Partial<ItemData>>({
    id: "",
    name: "",
    type: "weapon",
    rarity: "common",
    hpBoost: 0,
    atkBoost: 10,
    defBoost: 5,
    spdBoost: 0,
    price: 100,
    requiredLevel: 1,
    icon: "⚔️",
    description: "",
  });

  // Raw Database state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("users");
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized" | "forbidden">("checking");
  const [authErrorMsg, setAuthErrorMsg] = useState("");

  const adminFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("clb_token") || localStorage.getItem("token")) : null;
    const gmSecret = typeof window !== "undefined" ? localStorage.getItem("clb_gm_secret") : null;

    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (gmSecret) {
      headers["x-gm-secret"] = gmSecret;
    }

    try {
      const res = await fetch(url, {
        ...init,
        credentials: "include",
        headers,
      });

      if (res.status === 401) {
        setAuthStatus("unauthorized");
        setAuthErrorMsg("Phiên đăng nhập không hợp lệ hoặc chưa đăng nhập.");
        setStats(null);
        setUsers([]);
        setCharacters([]);
        setItems([]);
        setTables([]);
        setTableRows([]);
        return res;
      }

      if (res.status === 403) {
        setAuthStatus("forbidden");
        setAuthErrorMsg("Từ chối truy cập: Tài khoản không có quyền Quản trị viên (ADMIN).");
        setStats(null);
        setUsers([]);
        setCharacters([]);
        setItems([]);
        setTables([]);
        setTableRows([]);
        return res;
      }

      if (res.ok && authStatus !== "authorized") {
        setAuthStatus("authorized");
      }

      return res;
    } catch (err: any) {
      throw err;
    }
  };



  // Supabase Continuous Live Sync state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState("");
  const [supabaseConnectOpen, setSupabaseConnectOpen] = useState(false);

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch("/api/admin/supabase/status");
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch {}
  };

  const handleConnectSupabase = async () => {
    if (!supabaseUrlInput.trim()) {
      toast({ title: "Thiếu URL kết nối", description: "Vui lòng nhập chuỗi kết nối PostgreSQL Supabase (postgres://...)", variant: "destructive" });
      return;
    }
    setSupabaseLoading(true);
    try {
      const res = await fetch("/api/admin/supabase/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl: supabaseUrlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể kết nối Supabase");
      toast({ title: "Kết nối thành công", description: data.message });
      setSupabaseConnectOpen(false);
      setSupabaseUrlInput("");
      fetchSupabaseStatus();
      fetchTables();
      fetchStats();
    } catch (err: any) {
      toast({ title: "Lỗi kết nối Supabase", description: err.message, variant: "destructive" });
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    setSupabaseLoading(true);
    try {
      const res = await fetch("/api/admin/supabase/sync-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đồng bộ lên Supabase");
      toast({ title: "Đồng bộ thành công", description: data.message });
      fetchSupabaseStatus();
      fetchTables();
      fetchStats();
    } catch (err: any) {
      toast({ title: "Lỗi đồng bộ Supabase", description: err.message, variant: "destructive" });
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  // Fetch Users with real / dummy filter & counts
  const fetchUsers = async (filterOverride?: "all" | "real" | "dummy") => {
    setLoading(true);
    const activeFilter = filterOverride || userTypeFilter;
    try {
      const res = await adminFetch(`/api/admin/users?format=meta&filter=${activeFilter}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          setUsers(data.users);
          setUserCounts({
            total: data.totalCount ?? data.users.length,
            real: data.realCount ?? data.users.filter((u: any) => u.isRealUser).length,
            dummy: data.dummyCount ?? data.users.filter((u: any) => u.isDummy).length,
          });
        } else if (Array.isArray(data)) {
          setUsers(data);
          setUserCounts({
            total: data.length,
            real: data.filter((u: any) => u.isRealUser !== false).length,
            dummy: data.filter((u: any) => u.isDummy === true).length,
          });
        }
      }
    } catch (err: any) {
      toast({ title: "Lỗi tải người chơi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handle Purge Dummy Users
  const handlePurgeDummyUsers = () => {
    setConfirmDialog({
      open: true,
      title: "Dọn Dẹp Tài Khoản Ảo & Dữ Liệu Test",
      description: "Hệ thống sẽ quét và xóa sạch các tài khoản ảo (test_, dummy_, bot_). Toàn bộ 100% tài khoản thật của người chơi sẽ được bảo toàn tuyệt đối!",
      confirmText: "🧹 Dọn Dẹp Ngay",
      confirmVariant: "danger",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/admin/users/purge-dummy", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({
            title: "Dọn dẹp thành công",
            description: `${data.message} (Đã dọn: ${data.deletedCount ?? 0} tài khoản ảo)`,
          });
          fetchUsers();
          fetchStats();
        } catch (err: any) {
          toast({ title: "Lỗi dọn dẹp", description: err.message, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle Item Audit (Kiểm toán vật phẩm còn thiếu)
  const handleAuditItems = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/admin/items/audit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuditData(data);
      setAuditModalOpen(true);
      if (data.missingCount === 0) {
        toast({
          title: "Kiểm toán hoàn hảo",
          description: `Toàn bộ ${data.totalRegistered} vật phẩm trong game đã được đồng bộ chuẩn xác!`,
        });
      } else {
        toast({
          title: `Phát hiện ${data.missingCount} vật phẩm thiếu`,
          description: "Các vật phẩm này đã xuất hiện trong quái vật, nhiệm vụ hoặc hành trang nhưng chưa được ghi nhận vào catalog CSDL.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Lỗi kiểm toán", description: err.message, variant: "destructive" });
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle Sync Missing Items (Tự động ghi nhận vật phẩm còn thiếu vào Supabase DB)
  const handleSyncMissingItems = () => {
    setConfirmDialog({
      open: true,
      title: "Ghi Nhận & Bổ Sung Vật Phẩm Còn Thiếu",
      description: "Tự động tạo và ghi nhận toàn bộ vật phẩm đang thiếu vào danh mục cơ sở dữ liệu Supabase, đảm bảo người chơi nhận đủ dữ liệu và không bị lỗi thiếu item.",
      confirmText: "⚡ Đồng Bộ & Ghi Nhận Ngay",
      confirmVariant: "cyan",
      onConfirm: async () => {
        setSyncLoading(true);
        try {
          const res = await fetch("/api/admin/items/sync-missing", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({
            title: "Đồng bộ thành công",
            description: data.message,
          });
          fetchItems();
          fetchStats();
          // Re-audit after sync
          const auditRes = await fetch("/api/admin/items/audit");
          if (auditRes.ok) {
            setAuditData(await auditRes.json());
          }
        } catch (err: any) {
          toast({ title: "Lỗi đồng bộ", description: err.message, variant: "destructive" });
        } finally {
          setSyncLoading(false);
        }
      },
    });
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    toast({ title: "Đã đăng xuất", description: "Đã thoát phiên quản trị viên an toàn." });
    setLocation("/admin/login");
  };

  // Fetch Characters
  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/characters");
      if (res.ok) {
        const data = await res.json();
        setCharacters(data);
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tables
  const fetchTables = async () => {
    try {
      const res = await adminFetch("/api/admin/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch {
      // ignore
    }
  };

  // Fetch Table Rows
  const fetchTableRows = async (tableName: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/tables/${tableName}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTableRows(data.rows || []);
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStats();
    fetchTables();
    if (activeTab === "users") fetchUsers(userTypeFilter);
    else if (activeTab === "characters") {
      fetchCharacters();
      fetchItems();
    } else if (activeTab === "items") {
      fetchItems();
      // Auto check audit in background
      fetch("/api/admin/items/audit")
        .then((r) => r.json())
        .then((data) => setAuditData(data))
        .catch(() => {});
    } else if (activeTab === "db") {
      fetchTableRows(selectedTable);
      fetchSupabaseStatus();
    }
  }, [activeTab, isAuthenticated, userTypeFilter]);

  // Handle Save User
  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên tài khoản", variant: "destructive" });
      return;
    }
    try {
      if (userModal.mode === "create") {
        if (!userForm.password.trim()) {
          toast({ title: "Lỗi", description: "Vui lòng nhập mật khẩu", variant: "destructive" });
          return;
        }
        const res = await adminFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: `Đã tạo tài khoản ${userForm.username}!` });
      } else if (userModal.data) {
        const res = await adminFetch(`/api/admin/users/${userModal.data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: "Đã cập nhật tài khoản!" });
      }
      setUserModal({ open: false, mode: "create" });
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle Delete User
  const handleDeleteUser = (id: number, username: string) => {
    setConfirmDialog({
      open: true,
      title: "Xóa Tài Khoản",
      description: `Bạn có chắc chắn muốn xóa tài khoản "${username}" và toàn bộ nhân vật liên quan? Hành động này không thể hoàn tác.`,
      confirmText: "Xác Nhận Xóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({ title: "Đã xóa", description: data.message });
          fetchUsers();
          fetchStats();
        } catch (err: any) {
          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  // Handle Save Character
  const handleSaveCharacter = async () => {
    try {
      if (charModal.mode === "create") {
        const res = await adminFetch("/api/admin/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(charForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: "Đã tạo nhân vật mới!" });
      } else if (charModal.data) {
        const res = await adminFetch(`/api/admin/characters/${charModal.data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(charForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: "Đã cập nhật chỉ số nhân vật!" });
      }
      setCharModal({ open: false, mode: "edit" });
      fetchCharacters();
      fetchStats();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle Delete Character
  const handleDeleteCharacter = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Xóa Nhân Vật",
      description: `Bạn có chắc chắn muốn xóa nhân vật "${name}"? Toàn bộ trang bị và dữ liệu sẽ bị xóa vĩnh viễn.`,
      confirmText: "Xác Nhận Xóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/characters/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({ title: "Đã xóa", description: data.message });
          fetchCharacters();
          fetchStats();
        } catch (err: any) {
          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  // Handle Grant Item to Character
  const handleGrantItem = async () => {
    if (!charModal.data || !grantForm.itemId) {
      toast({ title: "Lỗi", description: "Vui lòng chọn vật phẩm", variant: "destructive" });
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/characters/${charModal.data.id}/grant-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grantForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Thành công", description: data.message });
      setCharModal({ open: false, mode: "edit" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle View Character Inventory
  const handleOpenInventory = async (c: CharacterData) => {
    try {
      const res = await adminFetch(`/api/admin/characters/${c.id}/items`);
      if (res.ok) {
        const items = await res.json();
        setCharItemsModal({ open: true, char: c, items });
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle Delete Item from Character Bag
  const handleDeleteCharItem = async (characterItemId: number) => {
    try {
      const res = await adminFetch(`/api/admin/character-items/${characterItemId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Đã xóa", description: "Đã xóa vật phẩm khỏi kho đồ!" });
        if (charItemsModal.char) handleOpenInventory(charItemsModal.char);
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle Save Item to Catalog
  const handleSaveItem = async () => {
    if (!itemForm.id || !itemForm.name) {
      toast({ title: "Lỗi", description: "Vui lòng nhập ID và Tên vật phẩm", variant: "destructive" });
      return;
    }
    try {
      if (itemModal.mode === "create") {
        const res = await adminFetch("/api/admin/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: "Đã thêm vật phẩm mới vào danh mục!" });
      } else if (itemModal.data) {
        const res = await adminFetch(`/api/admin/items/${itemModal.data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: "Thành công", description: "Đã cập nhật vật phẩm!" });
      }
      setItemModal({ open: false, mode: "create" });
      fetchItems();
      fetchStats();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  // Handle Delete Item from Catalog
  const handleDeleteItem = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Xóa Vật Phẩm",
      description: `Bạn có chắc chắn muốn xóa vật phẩm "${name}" (${id}) khỏi danh mục toàn game?`,
      confirmText: "Xác Nhận Xóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/items/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({ title: "Đã xóa", description: data.message });
          fetchItems();
          fetchStats();
        } catch (err: any) {
          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  // Handle Reseed Database (Non-blocking: solves INP blockage)
  const handleReseed = () => {
    setConfirmDialog({
      open: true,
      title: "Nạp Lại Seed Dữ Liệu",
      description: "Bạn có chắc chắn muốn nạp lại danh mục vật phẩm, quái vật, máy chủ và nhiệm vụ mẫu? Toàn bộ danh mục game sẽ được cập nhật.",
      confirmText: "Nạp Lại Ngay",
      confirmVariant: "cyan",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await adminFetch("/api/admin/db/reset-seed", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({ title: "Thành công", description: data.message });
          fetchStats();
          fetchTables();
        } catch (err: any) {
          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle Delete Row from Raw Table
  const handleDeleteRow = (tableName: string, id: any) => {
    setConfirmDialog({
      open: true,
      title: "Xóa Bản Ghi",
      description: `Bạn có chắc chắn muốn xóa bản ghi ID ${id} khỏi bảng ${tableName}?`,
      confirmText: "Xác Nhận Xóa",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/tables/${tableName}/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast({ title: "Đã xóa", description: data.message });
          fetchTableRows(tableName);
          fetchStats();
          fetchTables();
        } catch (err: any) {
          toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  // Filtered lists with complete null-safety
  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const s = (userSearch || "").toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(s) ||
      (u.id ?? "").toString().includes(userSearch) ||
      (u.forumTitle || "").toLowerCase().includes(s)
    );
  });

  const filteredCharacters = (characters || []).filter((c) => {
    if (!c) return false;
    const s = (charSearch || "").toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(s) ||
      (c.username || "").toLowerCase().includes(s) ||
      (c.className || c.classId || "").toLowerCase().includes(s)
    );
  });

  const filteredItems = (items || []).filter((i) => {
    if (!i) return false;
    const s = (itemSearch || "").toLowerCase();
    return (
      (i.name || "").toLowerCase().includes(s) ||
      (i.id || "").toLowerCase().includes(s) ||
      (i.type || i.category || "").toLowerCase().includes(s)
    );
  });

  const PAGE_SIZE = 25;
  const paginatedCharacters = filteredCharacters.slice((charPage - 1) * PAGE_SIZE, charPage * PAGE_SIZE);
  const totalCharPages = Math.max(1, Math.ceil(filteredCharacters.length / PAGE_SIZE));

  const paginatedItems = filteredItems.slice((itemPage - 1) * PAGE_SIZE, itemPage * PAGE_SIZE);
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  // Rarity color helper
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">Thần Thoại</span>;
      case "epic":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">Sử Thi</span>;
      case "rare":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">Hiếm</span>;
      case "uncommon":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Thường</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/40">Cơ Bản</span>;
    }
  };
  if (authStatus === "checking" && !stats) {
    return (
      <div className="min-h-screen w-full bg-[#1c161a] text-white flex flex-col items-center justify-center font-sans select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#28c3e1]/10 border border-[#28c3e1]/30 flex items-center justify-center text-[#28c3e1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-wide">Đang xác thực quyền Quản trị viên...</h2>
        <p className="text-sm text-[#8e7a7c] mt-2">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="min-h-screen w-full bg-[#1c161a] text-white flex flex-col items-center justify-center font-sans p-6 select-none">
        <div className="max-w-md w-full bg-[#2a2022] border border-[#5d4648] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-amber-400 mb-2">Yêu Cầu Đăng Nhập</h2>
          <p className="text-sm text-[#a49193] mb-6">
            Bạn chưa đăng nhập hoặc phiên làm việc đã kết thúc. Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN) để truy cập Bảng Quản Trị.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="w-full py-3 rounded-xl bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-black text-sm uppercase tracking-wider transition-all"
          >
            Đến Trang Đăng Nhập
          </button>
        </div>
      </div>
    );
  }

  if (authStatus === "forbidden") {
    return (
      <div className="min-h-screen w-full bg-[#1c161a] text-white flex flex-col items-center justify-center font-sans p-6 select-none">
        <div className="max-w-md w-full bg-[#2a2022] border border-rose-500/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-rose-400 mb-2">403 — Từ Chối Truy Cập</h2>
          <p className="text-sm text-[#a49193] mb-6">
            Tài khoản hiện tại của bạn không có đặc quyền Quản trị viên (ADMIN). Khu vực này chỉ dành riêng cho Ban Quản Trị hệ thống máy chủ Chiến Long Bí Sử.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setLocation("/characters")}
              className="w-full py-3 rounded-xl bg-[#4a383a] hover:bg-[#5d4648] text-white font-bold text-sm transition-all"
            >
              Quay Về Sảnh Nhân Vật
            </button>
            <button
              onClick={() => setLocation("/game")}
              className="w-full py-3 rounded-xl bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-black text-sm uppercase tracking-wider transition-all"
            >
              Tiếp Tục Vào Game
            </button>
          </div>
        </div>
      </div>
    );
  }



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#1c161a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl text-center"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#4a383a] border border-[#5d4648] flex items-center justify-center text-[#28c3e1]">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            KHU VỰC QUẢN TRỊ VIÊN
          </h2>
          <p className="text-xs text-[#8e7a7c] mb-6 leading-relaxed">
            Khu vực nội bộ dành riêng cho Ban Điều Hành. Người chơi vui lòng quay lại sảnh chính.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode.trim() === "chienlongba2026" || passcode.trim() === "admin" || passcode.trim() === "admin123") {
                sessionStorage.setItem("admin_authenticated", "true");
                setIsAuthenticated(true);
                toast({ title: "Xác thực thành công", description: "Chào mừng Quản trị viên!" });
              } else {
                toast({ title: "Sai mã bảo mật", description: "Mã quản trị không hợp lệ!", variant: "destructive" });
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Nhập mã bảo mật quản trị..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#271f20] border border-[#5d4648] text-white text-sm focus:border-[#28c3e1] focus:outline-none transition-all placeholder:text-[#5d4648]"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              Mở Khóa Quản Trị
            </button>

            <button
              type="button"
              onClick={() => setLocation("/")}
              className="w-full py-2.5 rounded-full bg-transparent hover:bg-[#4a383a] border border-[#5d4648] text-xs font-bold text-gray-300 transition-all"
            >
              Quay Về Sảnh Game
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#1c161a] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full bg-[#342a2b] border-b border-[#5d4648] px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#28c3e1]/20 border border-[#28c3e1]/40 flex items-center justify-center text-[#28c3e1] shadow-[0_0_15px_rgba(40,195,225,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              Chiến Long Bá
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#28c3e1] text-[#1c161a] tracking-normal">
                Admin Manager
              </span>
            </h1>
            <p className="text-xs text-[#8e7a7c]">Trung Tâm Quản Trị Người Chơi & Cơ Sở Dữ Liệu</p>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4a383a] border border-[#5d4648] text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${stats?.isPostgres ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-amber-400"}`} />
            <span className="font-semibold text-gray-200">
              {stats?.isPostgres ? "Supabase PostgreSQL" : "Standalone Memory"}
            </span>
          </div>

          <button
            onClick={() => setLocation("/characters")}
            className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-[#8e7a7c] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Sảnh Hero
          </button>

          <button
            onClick={() => setLocation("/game")}
            className="px-4 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(40,195,225,0.4)] transition-all flex items-center gap-1.5"
          >
            <Sword className="w-3.5 h-3.5" /> Vào Game
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Thoát quyền quản trị viên"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng Xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Navigation Tabs - Responsive Full Grid with Zero Cut-off */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 border-b border-[#5d4648] pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-center shadow-sm ${
              activeTab === "overview"
                ? "bg-[linear-gradient(135deg,#28c3e1_0%,#189cb6_100%)] text-[#1c161a] shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span className="truncate">Tổng Quan Hệ Thống</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-center shadow-sm ${
              activeTab === "users"
                ? "bg-[linear-gradient(135deg,#28c3e1_0%,#189cb6_100%)] text-[#1c161a] shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Tài Khoản ({stats?.counts?.users ?? users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("characters")}
            className={`w-full py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-center shadow-sm ${
              activeTab === "characters"
                ? "bg-[linear-gradient(135deg,#28c3e1_0%,#189cb6_100%)] text-[#1c161a] shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
            }`}
          >
            <Sword className="w-4 h-4 shrink-0" />
            <span className="truncate">Nhân Vật ({stats?.counts?.characters ?? characters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("items")}
            className={`w-full py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-center shadow-sm ${
              activeTab === "items"
                ? "bg-[linear-gradient(135deg,#28c3e1_0%,#189cb6_100%)] text-[#1c161a] shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
            }`}
          >
            <Backpack className="w-4 h-4 shrink-0" />
            <span className="truncate">Vật Phẩm ({stats?.counts?.items ?? items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("db")}
            className={`w-full py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-center shadow-sm col-span-2 sm:col-span-1 ${
              activeTab === "db"
                ? "bg-[linear-gradient(135deg,#28c3e1_0%,#189cb6_100%)] text-[#1c161a] shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span className="truncate">CSDL & Supabase Sync</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Tài Khoản</span>
                  <Users className="w-4 h-4 text-[#28c3e1]" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts?.users || users.length || 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Đã đăng ký</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Nhân Vật</span>
                  <Sword className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts?.characters || characters.length || 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Đang hoạt động</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Vật Phẩm</span>
                  <Backpack className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts?.items || items.length || 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Trong danh mục</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Đồ Trong Túi</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts.characterItems ?? 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Item sở hữu</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Quái Vật / Boss</span>
                  <Activity className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts.monsters ?? 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Bản đồ dã ngoại</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-[#8e7a7c] mb-2">
                  <span className="text-xs font-semibold">Máy Chủ</span>
                  <Server className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.counts.servers ?? 0}</div>
                <div className="text-[11px] text-[#8e7a7c] mt-1">Phân vùng S1-S4</div>
              </div>
            </div>

            {/* System Info Banner */}
            <div className="p-6 rounded-3xl bg-[#342a2b] border border-[#5d4648] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#28c3e1]" />
                  <h3 className="text-base font-bold text-white">Kết Nối Cơ Sở Dữ Liệu Hiện Tại</h3>
                </div>
                <p className="text-xs text-[#8e7a7c] max-w-xl">
                  {stats?.isPostgres ? (
                    <span className="text-emerald-300 font-medium">
                      ✓ Đang kết nối trực tiếp đến PostgreSQL Supabase Cloud qua Transaction Pooler (Cổng 6543). Mọi thay đổi dữ liệu người chơi và vật phẩm được lưu trữ vĩnh viễn trên cloud.
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium">
                      ⚠️ Đang chạy ở chế độ Standalone In-Memory (Không có CSDL ngoài). Dữ liệu được lưu trong bộ nhớ tạm.
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#8e7a7c] mt-1">
                  <span>Môi trường: <strong className="text-white">{stats?.nodeEnv}</strong></span>
                  <span>Thời gian chạy: <strong className="text-white">{stats?.uptimeSeconds}s</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchStats}
                  className="px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
                </button>
                <button
                  onClick={handleReseed}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(40,195,225,0.4)] disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" /> Nạp Lại Seed Dữ Liệu
                </button>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab("users")}
                className="p-5 rounded-2xl bg-[#342a2b] border border-[#5d4648] hover:border-[#28c3e1] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#28c3e1]/20 flex items-center justify-center text-[#28c3e1]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#28c3e1] transition-colors">Quản Lý Người Chơi</h4>
                    <p className="text-xs text-[#8e7a7c]">Thêm, sửa, reset mật khẩu, xóa tài khoản</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8e7a7c] group-hover:translate-x-1 transition-transform" />
              </div>

              <div
                onClick={() => setActiveTab("characters")}
                className="p-5 rounded-2xl bg-[#342a2b] border border-[#5d4648] hover:border-[#28c3e1] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Sword className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Quản Lý Nhân Vật</h4>
                    <p className="text-xs text-[#8e7a7c]">Chỉnh sửa Level, Vàng, HP/MP, cấp item</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8e7a7c] group-hover:translate-x-1 transition-transform" />
              </div>

              <div
                onClick={() => setActiveTab("items")}
                className="p-5 rounded-2xl bg-[#342a2b] border border-[#5d4648] hover:border-[#28c3e1] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Backpack className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Danh Mục Vật Phẩm</h4>
                    <p className="text-xs text-[#8e7a7c]">Tạo trang bị mới, chỉnh sửa chỉ số buff</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8e7a7c] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            {/* Filter Pills & Purge Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#342a2b] border border-[#5d4648]">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#8e7a7c] flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#28c3e1]" /> Bộ lọc:
                </span>
                <button
                  onClick={() => {
                    setUserTypeFilter("all");
                    fetchUsers("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userTypeFilter === "all"
                      ? "bg-[#28c3e1] text-[#1c161a] shadow-[0_0_12px_rgba(40,195,225,0.4)]"
                      : "bg-[#4a383a] text-gray-300 hover:text-white border border-[#5d4648]"
                  }`}
                >
                  Tất Cả ({userCounts.total || users.length})
                </button>
                <button
                  onClick={() => {
                    setUserTypeFilter("real");
                    fetchUsers("real");
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userTypeFilter === "real"
                      ? "bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "bg-[#4a383a] text-gray-300 hover:text-white border border-[#5d4648]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  👤 Người Chơi Thật ({userCounts.real})
                </button>
                <button
                  onClick={() => {
                    setUserTypeFilter("dummy");
                    fetchUsers("dummy");
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userTypeFilter === "dummy"
                      ? "bg-amber-500 text-gray-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "bg-[#4a383a] text-gray-300 hover:text-white border border-[#5d4648]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  🤖 Tài Khoản Ảo / Test ({userCounts.dummy})
                </button>
              </div>

              {/* Purge Button */}
              <button
                onClick={handlePurgeDummyUsers}
                className="px-4 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Loại bỏ tài khoản ảo, giữ 100% tài khoản thật"
              >
                <Trash2 className="w-3.5 h-3.5" /> 🧹 Dọn Dẹp Tài Khoản Ảo ({userCounts.dummy})
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e7a7c]" />
                <input
                  type="text"
                  placeholder="Tìm theo Username, ID, danh hiệu..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchUsers()}
                  className="px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
                </button>
                <button
                  onClick={() => {
                    setUserForm({
                      username: "",
                      password: "",
                      forumTitle: "Tân Thủ Long Tộc",
                      selectedServerId: "s1_long_vuong",
                    });
                    setUserModal({ open: true, mode: "create" });
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Thêm Người Chơi Mới
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-[#342a2b] border border-[#5d4648] overflow-hidden shadow-xl">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#271f20] sticky top-0 z-10 text-[#8e7a7c] uppercase tracking-wider text-[11px] border-b border-[#5d4648]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Tài Khoản</th>
                      <th className="py-3 px-4">Phân Loại</th>
                      <th className="py-3 px-4">Danh Hiệu</th>
                      <th className="py-3 px-4">Máy Chủ</th>
                      <th className="py-3 px-4">Nhân Vật</th>
                      <th className="py-3 px-4">Ngày Đăng Ký</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5d4648]/60 text-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#8e7a7c]">
                          Không tìm thấy tài khoản người chơi nào phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#4a383a]/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-400">#{u.id}</td>
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${u.isDummy ? "bg-amber-400" : "bg-[#28c3e1]"}`} />
                            {u.username}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.role === "admin" || u.username === "admin" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-[#28c3e1] border border-cyan-500/40">
                                  GM ADMIN
                                </span>
                              ) : u.isDummy ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Ảo / Test
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  👤 Người Thật
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{u.forumTitle}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                              {u.selectedServerId}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-amber-400">{u.characterCount}</span>
                              {u.characters.map((c) => (
                                <span
                                  key={c.id}
                                  className="px-2 py-0.5 rounded text-[10px] bg-[#4a383a] text-gray-300 border border-[#5d4648]"
                                >
                                  {c.name} (Lv.{c.level})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setUserForm({
                                    username: u.username,
                                    password: "",
                                    forumTitle: u.forumTitle,
                                    selectedServerId: u.selectedServerId,
                                  });
                                  setUserModal({ open: true, mode: "edit", data: u });
                                }}
                                className="p-1.5 rounded-lg bg-[#4a383a] hover:bg-[#5d4648] text-gray-300 hover:text-white transition-colors"
                                title="Chỉnh sửa / Đổi mật khẩu"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHARACTERS MANAGEMENT */}
        {activeTab === "characters" && (
          <div className="flex flex-col gap-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e7a7c]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhân vật, class, tài khoản..."
                  value={charSearch}
                  onChange={(e) => { setCharSearch(e.target.value); setCharPage(1); }}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCharacters}
                  className="px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
                </button>
                <button
                  onClick={() => {
                    setCharForm({
                      userId: users[0]?.id || 1,
                      name: "Tân Thủ Long Tộc",
                      classId: "fighter",
                      level: 1,
                      gold: 5000,
                      serverId: "s1_long_vuong",
                    });
                    setCharModal({ open: true, mode: "create" });
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Tạo Nhân Vật Mới
                </button>
              </div>
            </div>

            {/* Characters Table */}
            <div className="rounded-2xl bg-[#342a2b] border border-[#5d4648] overflow-hidden shadow-xl">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#271f20] sticky top-0 z-10 text-[#8e7a7c] uppercase tracking-wider text-[11px] border-b border-[#5d4648]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nhân Vật</th>
                      <th className="py-3 px-4">Chủ Sở Hữu</th>
                      <th className="py-3 px-4">Môn Phái</th>
                      <th className="py-3 px-4">Cấp Độ</th>
                      <th className="py-3 px-4">Lực Chiến</th>
                      <th className="py-3 px-4">Sinh Lực (HP)</th>
                      <th className="py-3 px-4">Vàng (Gold)</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5d4648]/60 text-gray-200">
                    {paginatedCharacters.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#8e7a7c]">
                          Không có nhân vật nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedCharacters.map((c) => (
                        <tr key={c.id} className="hover:bg-[#4a383a]/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-400">#{c.id}</td>
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="text-amber-400">⚔️</span>
                            {c.name}
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-semibold">{c.username}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#28c3e1]/10 text-[#28c3e1] border border-[#28c3e1]/30">
                              {c.className || c.classId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-400">Lv. {c.level}</td>
                          <td className="py-3 px-4 font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(40,195,225,0.4)]">
                            ⚡ {c.combatPower ?? 0}
                          </td>
                          <td className="py-3 px-4 text-rose-300">
                            {c.hp ?? 0}/{c.maxHp ?? 0}
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-bold">
                            🪙 {(c.gold ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInventory(c)}
                                className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 transition-colors"
                                title="Xem kho đồ & trang bị"
                              >
                                <Backpack className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setCharModal({ open: true, mode: "grant", data: c });
                                  setGrantForm({ itemId: items[0]?.id || "gear_fighter_main_weapon_rare", quantity: 1, enhanceLevel: 0 });
                                }}
                                className="p-1.5 rounded-lg bg-[#28c3e1]/20 hover:bg-[#28c3e1]/40 text-[#28c3e1] transition-colors"
                                title="Cấp trang bị thần binh"
                              >
                                <Gift className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setCharForm({ ...c });
                                  setCharModal({ open: true, mode: "edit", data: c });
                                }}
                                className="p-1.5 rounded-lg bg-[#4a383a] hover:bg-[#5d4648] text-gray-300 hover:text-white transition-colors"
                                title="Sửa chỉ số"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCharacter(c.id, c.name)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                                title="Xóa nhân vật"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ITEMS MANAGEMENT */}
        {activeTab === "items" && (
          <div className="flex flex-col gap-4">
            {/* ITEM AUDIT & SYNC MISSING STATUS BANNER */}
            <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${
                    auditData?.missingCount && auditData.missingCount > 0
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-[#28c3e1]/20 text-[#28c3e1] border-[#28c3e1]/40"
                  }`}
                >
                  {auditData?.missingCount && auditData.missingCount > 0 ? (
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Kiểm Toán Vật Phẩm Toàn Game (Database Integrity & Item Audit)
                    {auditData && (
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          auditData.missingCount > 0
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {auditData.missingCount > 0
                          ? `Thiếu ${auditData.missingCount} Vật Phẩm`
                          : "Đã Đồng Bộ 100% CSDL"}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#8e7a7c]">
                    Đối chiếu danh mục vật phẩm trong CSDL Supabase với quái vật rớt đồ, nhiệm vụ và hành trang người chơi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleAuditItems}
                  disabled={auditLoading}
                  className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-gray-200 hover:text-white border border-[#5d4648] text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5 text-[#28c3e1]" />
                  {auditLoading ? "Đang quét..." : "🔍 Quét & Kiểm Toán"}
                </button>

                <button
                  onClick={handleSyncMissingItems}
                  disabled={syncLoading}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md ${
                    auditData && auditData.missingCount > 0
                      ? "bg-amber-500 hover:brightness-110 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse"
                      : "bg-[#28c3e1] hover:brightness-110 text-[#1c161a] shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {syncLoading ? "Đang nạp CSDL..." : "⚡ Ghi Nhận Dữ Liệu Còn Thiếu"}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e7a7c]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên vật phẩm, ID, loại..."
                  value={itemSearch}
                  onChange={(e) => { setItemSearch(e.target.value); setItemPage(1); }}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white placeholder-[#8e7a7c] text-xs font-medium focus:ring-2 focus:ring-[#28c3e1] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchItems}
                  className="px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
                </button>
                <button
                  onClick={() => {
                    setItemForm({
                      id: "item_custom_" + Date.now().toString().slice(-4),
                      name: "Huyền Thiết Thần Kiếm",
                      type: "weapon",
                      category: "equipment",
                      equipSlot: "weapon",
                      rarity: "epic",
                      hpBoost: 200,
                      atkBoost: 80,
                      defBoost: 25,
                      spdBoost: 10,
                      price: 2500,
                      requiredLevel: 10,
                      icon: "🗡️",
                      description: "Thần kiếm luyện từ huyền thiết ngàn năm, tỏa hàn khí lạnh thấu xương.",
                    });
                    setItemModal({ open: true, mode: "create" });
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Thêm Vật Phẩm Mới
                </button>
              </div>
            </div>

            {/* Items Grid / Table */}
            <div className="rounded-2xl bg-[#342a2b] border border-[#5d4648] overflow-hidden shadow-xl">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#271f20] sticky top-0 z-10 text-[#8e7a7c] uppercase tracking-wider text-[11px] border-b border-[#5d4648]">
                    <tr>
                      <th className="py-3 px-4">Icon</th>
                      <th className="py-3 px-4">Mã ID</th>
                      <th className="py-3 px-4">Tên Vật Phẩm</th>
                      <th className="py-3 px-4">Loại</th>
                      <th className="py-3 px-4">Độ Hiếm</th>
                      <th className="py-3 px-4">Chỉ Số Tăng Cường</th>
                      <th className="py-3 px-4">Giá Bán</th>
                      <th className="py-3 px-4">Cấp Y/C</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#5d4648]/60 text-gray-200">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#8e7a7c]">
                          Không có vật phẩm nào trong danh mục.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((i) => (
                        <tr key={i.id} className="hover:bg-[#4a383a]/40 transition-colors">
                          <td className="py-3 px-4 text-lg">{i.icon || "◇"}</td>
                          <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{i.id}</td>
                          <td className="py-3 px-4 font-bold text-white">{i.name}</td>
                          <td className="py-3 px-4 text-gray-300 uppercase text-[10px] tracking-wider font-semibold">
                            {i.type}
                          </td>
                          <td className="py-3 px-4">{getRarityBadge(i.rarity || "common")}</td>
                          <td className="py-3 px-4 text-[11px] text-gray-300">
                            {i.atkBoost > 0 && <span className="text-amber-400 mr-2 font-bold">ATK +{i.atkBoost}</span>}
                            {i.defBoost > 0 && <span className="text-sky-400 mr-2 font-bold">DEF +{i.defBoost}</span>}
                            {i.hpBoost > 0 && <span className="text-rose-400 mr-2 font-bold">HP +{i.hpBoost}</span>}
                            {i.spdBoost > 0 && <span className="text-emerald-400 mr-2 font-bold">SPD +{i.spdBoost}</span>}
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-bold">🪙 {(i.price ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-300">Lv. {i.requiredLevel}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setItemForm({ ...i });
                                  setItemModal({ open: true, mode: "edit", data: i });
                                }}
                                className="p-1.5 rounded-lg bg-[#4a383a] hover:bg-[#5d4648] text-gray-300 hover:text-white transition-colors"
                                title="Chỉnh sửa vật phẩm"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(i.id, i.name)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                                title="Xóa vật phẩm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RAW DATABASE INSPECTOR & LIVE SUPABASE SYNC */}
        {activeTab === "db" && (
          <div className="flex flex-col gap-6">
            {/* Supabase Continuous Live Sync Panel */}
            <div className="p-5 sm:p-6 rounded-[24px] bg-[linear-gradient(135deg,#241c22_0%,#342a2b_100%)] border border-[#5d4648] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#28c3e1]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#5d4648]/80 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#4a383a] border border-[#5d4648] flex items-center justify-center text-[#28c3e1] shadow-inner">
                    <Database className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        TRUNG TÂM TRAO ĐỔI & ĐỒNG BỘ DỮ LIỆU SUPABASE
                      </h2>
                      {supabaseStatus?.isPostgres ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Đang Kết Nối Supabase Cloud ({supabaseStatus?.pingMs ?? 15}ms)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Chế Độ Nội Bộ (Chờ kết nối Supabase)</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8e7a7c] mt-1 leading-relaxed">
                      Toàn bộ tài khoản, nhân vật, hành trang, trận đấu và thao tác quản trị được lưu trữ và trao đổi trực tiếp với PostgreSQL Supabase.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setSupabaseConnectOpen(!supabaseConnectOpen)}
                    className="px-4 py-2.5 rounded-full bg-[#4a383a] hover:bg-[#5d4648] border border-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4 text-[#28c3e1]" />
                    <span>Cấu Hình Kết Nối Supabase</span>
                  </button>

                  <button
                    onClick={handleSyncAllToSupabase}
                    disabled={supabaseLoading || !supabaseStatus?.isPostgres}
                    className="px-5 py-2.5 rounded-full bg-[#28c3e1] hover:brightness-110 disabled:opacity-50 text-[#1c161a] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(40,195,225,0.4)]"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{supabaseLoading ? "Đang Đồng Bộ..." : "⚡ Đẩy Toàn Bộ Dữ Liệu Lên Supabase (Sync Now)"}</span>
                  </button>
                </div>
              </div>

              {/* Expandable Connect Form */}
              {supabaseConnectOpen && (
                <div className="mt-5 p-4 rounded-2xl bg-[#271f20] border border-[#5d4648] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#28c3e1]" />
                      Nhập Chuỗi Kết Nối Supabase PostgreSQL (URI)
                    </span>
                    <button
                      onClick={() => setSupabaseConnectOpen(false)}
                      className="text-[#8e7a7c] hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#8e7a7c]">
                    Lấy chuỗi URI tại Supabase Dashboard: <strong>Project Settings → Database → Connection String (URI)</strong> (sử dụng cổng 5432 hoặc pooler 6543).
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      className="flex-1 h-11 px-3.5 rounded-xl bg-[#342a2b] border border-[#5d4648] text-white text-xs font-mono outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                    <button
                      onClick={handleConnectSupabase}
                      disabled={supabaseLoading}
                      className="px-6 h-11 rounded-xl bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0"
                    >
                      {supabaseLoading ? "Đang Kiểm Tra..." : "Kết Nối Ngay"}
                    </button>
                  </div>
                </div>
              )}

              {/* Realtime Live Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-5">
                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Host Supabase</span>
                  <strong className="text-xs text-white font-mono truncate block mt-0.5" title={supabaseStatus?.host}>
                    {supabaseStatus?.host || "cuhzhzfzvutldgsfmoyw"}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Tài Khoản (Users)</span>
                  <strong className="text-base font-black text-[#28c3e1] block mt-0.5">
                    {supabaseStatus?.counts?.users ?? stats?.counts?.users ?? 0}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Nhân Vật (Chars)</span>
                  <strong className="text-base font-black text-amber-400 block mt-0.5">
                    {supabaseStatus?.counts?.characters ?? stats?.counts?.characters ?? 0}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Vật Phẩm (Items)</span>
                  <strong className="text-base font-black text-purple-400 block mt-0.5">
                    {supabaseStatus?.counts?.items ?? stats?.counts?.items ?? 0}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Hành Trang (Bag)</span>
                  <strong className="text-base font-black text-emerald-400 block mt-0.5">
                    {supabaseStatus?.counts?.characterItems ?? stats?.counts?.characterItems ?? 0}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-[#271f20]/80 border border-[#5d4648]/60">
                  <span className="text-[11px] text-[#8e7a7c] block">Nhiệm Vụ (Quests)</span>
                  <strong className="text-base font-black text-rose-400 block mt-0.5">
                    {supabaseStatus?.counts?.quests ?? stats?.counts?.quests ?? 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Table Selector Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setSelectedTable(t.name);
                    fetchTableRows(t.name);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedTable === t.name
                      ? "bg-[#28c3e1] text-[#1c161a] shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                      : "bg-[#342a2b] text-[#8e7a7c] hover:text-white border border-[#5d4648]"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                    {t.rowCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Table Viewer Header */}
            <div className="p-4 rounded-2xl bg-[#342a2b] border border-[#5d4648] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#28c3e1]" /> Bảng: <strong className="text-[#28c3e1] font-mono">{selectedTable}</strong>
                </h3>
                <p className="text-xs text-[#8e7a7c]">
                  Hiển thị {tableRows.length} bản ghi gần nhất từ database Supabase.
                </p>
              </div>
              <button
                onClick={() => fetchTableRows(selectedTable)}
                className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-white transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
              </button>
            </div>

            {/* Raw Rows */}
            <div className="rounded-2xl bg-[#342a2b] border border-[#5d4648] overflow-hidden shadow-xl">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                {tableRows.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8e7a7c]">
                    Bảng này hiện chưa có dòng dữ liệu nào.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#271f20] sticky top-0 z-10 text-[#8e7a7c] uppercase tracking-wider text-[11px] border-b border-[#5d4648]">
                      <tr>
                        {Object.keys(tableRows[0] || {}).map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5d4648]/60 text-gray-200">
                      {tableRows.map((row, idx) => (
                        <tr key={row.id ?? idx} className="hover:bg-[#4a383a]/40 transition-colors">
                          {Object.entries(row).map(([k, val]: any) => (
                            <td key={k} className="py-2.5 px-3 max-w-[240px] truncate" title={String(val)}>
                              {typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right">
                            {row.id !== undefined && (
                              <button
                                onClick={() => handleDeleteRow(selectedTable, row.id)}
                                className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: USER CREATE / EDIT */}
      <AnimatePresence>
        {userModal.open && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl p-6 flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#5d4648] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#28c3e1]" />
                  {userModal.mode === "create" ? "Thêm Người Chơi Mới" : `Chỉnh Sửa: ${userModal.data?.username}`}
                </h3>
                <button
                  onClick={() => setUserModal({ open: false, mode: "create" })}
                  className="p-1 rounded-full text-[#8e7a7c] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div>
                  <label className="text-[#8e7a7c] block mb-1">Tên Đăng Nhập</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="ví dụ: hero_long_2026"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                  />
                </div>

                <div>
                  <label className="text-[#8e7a7c] block mb-1">
                    {userModal.mode === "create" ? "Mật Khẩu" : "Mật Khẩu Mới (Để trống nếu giữ nguyên)"}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={userModal.mode === "create" ? "Tối thiểu 6 ký tự" : "Nhập mật khẩu mới"}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                  />
                </div>

                <div>
                  <label className="text-[#8e7a7c] block mb-1">Danh Hiệu</label>
                  <input
                    type="text"
                    value={userForm.forumTitle}
                    onChange={(e) => setUserForm({ ...userForm, forumTitle: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                  />
                </div>

                <div>
                  <label className="text-[#8e7a7c] block mb-1">Máy Chủ Mặc Định</label>
                  <select
                    value={userForm.selectedServerId}
                    onChange={(e) => setUserForm({ ...userForm, selectedServerId: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                  >
                    <option value="s1_long_vuong">S1 - Long Vương (VN)</option>
                    <option value="s2_hac_am">S2 - Hắc Ám (VN)</option>
                    <option value="s3_thien_phat">S3 - Thiên Phạt (SEA)</option>
                    <option value="s4_huyet_nguyet">S4 - Huyết Nguyệt (GLOBAL)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#5d4648]">
                <button
                  onClick={() => setUserModal({ open: false, mode: "create" })}
                  className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-5 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                >
                  Lưu Tài Khoản
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CHARACTER EDIT / CREATE / GRANT */}
      <AnimatePresence>
        {charModal.open && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl p-6 flex flex-col gap-5 text-white my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#5d4648] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sword className="w-5 h-5 text-amber-400" />
                  {charModal.mode === "grant"
                    ? `Cấp Trang Bị Cho: ${charModal.data?.name}`
                    : charModal.mode === "create"
                    ? "Tạo Nhân Vật Mới"
                    : `Sửa Thuộc Tính: ${charModal.data?.name}`}
                </h3>
                <button
                  onClick={() => setCharModal({ open: false, mode: "edit" })}
                  className="p-1 rounded-full text-[#8e7a7c] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GRANT ITEM FORM */}
              {charModal.mode === "grant" ? (
                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Chọn Vật Phẩm Từ Danh Mục</label>
                    <select
                      value={grantForm.itemId}
                      onChange={(e) => setGrantForm({ ...grantForm, itemId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    >
                      <option value="">-- Chọn Vật Phẩm --</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.icon} {i.name} ({i.rarity.toUpperCase()} - {i.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Số Lượng</label>
                      <input
                        type="number"
                        min="1"
                        value={grantForm.quantity}
                        onChange={(e) => setGrantForm({ ...grantForm, quantity: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Cấp Cường Hóa (+0 đến +15)</label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={grantForm.enhanceLevel}
                        onChange={(e) => setGrantForm({ ...grantForm, enhanceLevel: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#5d4648]">
                    <button
                      onClick={() => setCharModal({ open: false, mode: "edit" })}
                      className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleGrantItem}
                      className="px-5 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                    >
                      Cấp Vào Túi Đồ
                    </button>
                  </div>
                </div>
              ) : (
                /* EDIT STATS FORM */
                <div className="flex flex-col gap-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Tên Nhân Vật</label>
                      <input
                        type="text"
                        value={charForm.name || ""}
                        onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Môn Phái</label>
                      <select
                        value={charForm.classId || "fighter"}
                        onChange={(e) => setCharForm({ ...charForm, classId: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      >
                        <option value="tank">🛡️ Hộ Vệ (Tank)</option>
                        <option value="fighter">⚔️ Chiến Binh (Fighter)</option>
                        <option value="assassin">🗡️ Sát Thủ (Assassin)</option>
                        <option value="gunner">🔫 Xạ Thủ (Gunner)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Cấp Độ (Level)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={charForm.level || 1}
                        onChange={(e) => setCharForm({ ...charForm, level: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Vàng (Gold)</label>
                      <input
                        type="number"
                        min="0"
                        value={charForm.gold || 0}
                        onChange={(e) => setCharForm({ ...charForm, gold: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-[#8e7a7c] block mb-1">Lực Chiến</label>
                      <input
                        type="number"
                        min="0"
                        value={charForm.combatPower || 0}
                        onChange={(e) => setCharForm({ ...charForm, combatPower: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-rose-400 block mb-1">Sinh Lực (HP / Max HP)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={charForm.hp || 100}
                          onChange={(e) => setCharForm({ ...charForm, hp: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                        />
                        <span>/</span>
                        <input
                          type="number"
                          value={charForm.maxHp || 100}
                          onChange={(e) => setCharForm({ ...charForm, maxHp: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-blue-400 block mb-1">Ma Lực (MP / Max MP)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={charForm.mp || 100}
                          onChange={(e) => setCharForm({ ...charForm, mp: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                        />
                        <span>/</span>
                        <input
                          type="number"
                          value={charForm.maxMp || 100}
                          onChange={(e) => setCharForm({ ...charForm, maxMp: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-amber-400 block mb-1">Sát Thương (ATK)</label>
                      <input
                        type="number"
                        value={charForm.atk || 20}
                        onChange={(e) => setCharForm({ ...charForm, atk: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-sky-400 block mb-1">Phòng Thủ (DEF)</label>
                      <input
                        type="number"
                        value={charForm.def || 10}
                        onChange={(e) => setCharForm({ ...charForm, def: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                    <div>
                      <label className="text-emerald-400 block mb-1">Tốc Độ (SPD)</label>
                      <input
                        type="number"
                        value={charForm.spd || 10}
                        onChange={(e) => setCharForm({ ...charForm, spd: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#5d4648]">
                    <button
                      onClick={() => setCharModal({ open: false, mode: "edit" })}
                      className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveCharacter}
                      className="px-5 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                    >
                      Lưu Thay Đổi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CHARACTER INVENTORY VIEWER */}
      <AnimatePresence>
        {charItemsModal.open && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl p-6 flex flex-col gap-4 text-white max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#5d4648] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Backpack className="w-5 h-5 text-purple-400" />
                  Kho Đồ Nhân Vật: {charItemsModal.char?.name} ({charItemsModal.items.length} món)
                </h3>
                <button
                  onClick={() => setCharItemsModal({ open: false, items: [] })}
                  className="p-1 rounded-full text-[#8e7a7c] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {charItemsModal.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8e7a7c]">
                  Túi đồ của nhân vật này hiện đang trống.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {charItemsModal.items.map((ci: any) => (
                    <div
                      key={ci.id}
                      className="p-3 rounded-xl bg-[#4a383a] border border-[#5d4648] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{ci.itemDetails?.icon || "◇"}</div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {ci.itemDetails?.name || ci.itemId}
                            {ci.enhanceLevel > 0 && (
                              <span className="text-amber-400 font-black">+{ci.enhanceLevel}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Số lượng: <strong className="text-white">{ci.quantity}</strong> | Slot: {ci.slotIndex}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCharItem(ci.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
                        title="Xóa vật phẩm này khỏi túi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ITEM CATALOG CREATE / EDIT */}
      <AnimatePresence>
        {itemModal.open && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-[28px] bg-[#342a2b] border border-[#5d4648] shadow-2xl p-6 flex flex-col gap-4 text-white my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#5d4648] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Backpack className="w-5 h-5 text-[#28c3e1]" />
                  {itemModal.mode === "create" ? "Thêm Vật Phẩm Mới Vào Danh Mục" : `Sửa Vật Phẩm: ${itemModal.data?.name}`}
                </h3>
                <button
                  onClick={() => setItemModal({ open: false, mode: "create" })}
                  className="p-1 rounded-full text-[#8e7a7c] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Mã ID (Độc nhất)</label>
                    <input
                      type="text"
                      disabled={itemModal.mode === "edit"}
                      value={itemForm.id || ""}
                      onChange={(e) => setItemForm({ ...itemForm, id: e.target.value })}
                      placeholder="weapon_sword_01"
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1] disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#8e7a7c] block mb-1">Tên Vật Phẩm</label>
                    <input
                      type="text"
                      value={itemForm.name || ""}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="ví dụ: Long Thần Đao"
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Icon Emoji</label>
                    <input
                      type="text"
                      value={itemForm.icon || "⚔️"}
                      onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white text-center text-lg outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Loại (Type)</label>
                    <select
                      value={itemForm.type || "weapon"}
                      onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    >
                      <option value="weapon">Vũ khí (Weapon)</option>
                      <option value="armor">Áo giáp (Armor)</option>
                      <option value="helmet">Mũ nón (Helmet)</option>
                      <option value="gloves">Găng tay (Gloves)</option>
                      <option value="boots">Giày chiến (Boots)</option>
                      <option value="ring">Nhẫn (Ring)</option>
                      <option value="necklace">Dây chuyền (Necklace)</option>
                      <option value="shield">Khiên (Shield)</option>
                      <option value="potion">Thuốc (Potion)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Độ Hiếm</label>
                    <select
                      value={itemForm.rarity || "common"}
                      onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    >
                      <option value="common">Cơ Bản (Common)</option>
                      <option value="uncommon">Thường (Uncommon)</option>
                      <option value="rare">Hiếm (Rare)</option>
                      <option value="epic">Sử Thi (Epic)</option>
                      <option value="legendary">Thần Thoại (Legendary)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-amber-400 block mb-1">Công (ATK)</label>
                    <input
                      type="number"
                      value={itemForm.atkBoost || 0}
                      onChange={(e) => setItemForm({ ...itemForm, atkBoost: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                  <div>
                    <label className="text-sky-400 block mb-1">Thủ (DEF)</label>
                    <input
                      type="number"
                      value={itemForm.defBoost || 0}
                      onChange={(e) => setItemForm({ ...itemForm, defBoost: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                  <div>
                    <label className="text-rose-400 block mb-1">Máu (HP)</label>
                    <input
                      type="number"
                      value={itemForm.hpBoost || 0}
                      onChange={(e) => setItemForm({ ...itemForm, hpBoost: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                  <div>
                    <label className="text-emerald-400 block mb-1">Tốc (SPD)</label>
                    <input
                      type="number"
                      value={itemForm.spdBoost || 0}
                      onChange={(e) => setItemForm({ ...itemForm, spdBoost: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-amber-300 block mb-1">Giá Bán (Vàng)</label>
                    <input
                      type="number"
                      value={itemForm.price || 0}
                      onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8e7a7c] block mb-1">Cấp Yêu Cầu</label>
                    <input
                      type="number"
                      value={itemForm.requiredLevel || 1}
                      onChange={(e) => setItemForm({ ...itemForm, requiredLevel: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#8e7a7c] block mb-1">Mô Tả Vật Phẩm</label>
                  <textarea
                    rows={2}
                    value={itemForm.description || ""}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#4a383a] border border-[#5d4648] text-white outline-none focus:ring-2 focus:ring-[#28c3e1]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#5d4648]">
                <button
                  onClick={() => setItemModal({ open: false, mode: "create" })}
                  className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-5 py-2 rounded-full bg-[#28c3e1] hover:brightness-110 text-[#1c161a] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                >
                  Lưu Vật Phẩm
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* NON-BLOCKING CONFIRMATION MODAL (Eliminates INP blockage) */}
        {confirmDialog.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#342a2b] border border-[#5d4648] shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-left flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmDialog.confirmVariant === "danger"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-[#28c3e1]/20 text-[#28c3e1] border border-[#28c3e1]/40"
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                  <p className="text-xs text-[#8e7a7c]">Xác nhận thao tác quản trị</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#4a383a]/60 p-3.5 rounded-xl border border-[#5d4648]/60">
                {confirmDialog.description}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-full bg-[#4a383a] hover:bg-[#5d4648] text-xs font-bold text-gray-300 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog((prev) => ({ ...prev, open: false }));
                    if (action) await action();
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                      : "bg-[#28c3e1] hover:brightness-110 text-[#1c161a] shadow-[0_0_15px_rgba(40,195,225,0.4)]"
                  }`}
                >
                  {confirmDialog.confirmText || "Xác Nhận"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

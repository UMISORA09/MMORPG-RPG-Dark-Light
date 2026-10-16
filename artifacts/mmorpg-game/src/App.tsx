import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AuthScreen from '@/pages/AuthScreen';
import CharacterSelectScreen from '@/pages/CharacterSelectScreen';
import CommunityPortalScreen from '@/pages/CommunityPortalScreen';
import GamePage from '@/pages/game';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthScreen} />
      <Route path="/login" component={AuthScreen} />
      <Route path="/register" component={AuthScreen} />
      <Route path="/portal" component={CommunityPortalScreen} />
      <Route path="/characters" component={CharacterSelectScreen} />
      <Route path="/select-class" component={CharacterSelectScreen} />
      <Route path="/game" component={GamePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

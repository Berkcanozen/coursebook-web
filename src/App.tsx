import { useAuth } from './auth/auth';
import { AuthScreen } from './screens/AuthScreen';
import { Shell } from './Shell';
import { PwaPrompt } from './PwaPrompt';

export function App() {
  const { token, ready } = useAuth();
  if (!ready) return <div className="app" />;
  return (
    <>
      {token ? <Shell /> : <AuthScreen />}
      <PwaPrompt />
    </>
  );
}

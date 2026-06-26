import { useAuth } from './auth/auth';
import { AuthScreen } from './screens/AuthScreen';
import { ResetPassword } from './screens/ResetPassword';
import { Shell } from './Shell';
import { PwaPrompt } from './PwaPrompt';

export function App() {
  const { token, ready, recovery } = useAuth();
  if (!ready) return <div className="app" />;
  return (
    <>
      {recovery ? <ResetPassword /> : token ? <Shell /> : <AuthScreen />}
      <PwaPrompt />
    </>
  );
}

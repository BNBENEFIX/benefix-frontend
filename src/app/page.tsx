import { MarketingLanding } from '../components/MarketingLanding';
import { AuthenticatedRedirect } from '../components/AuthenticatedRedirect';

export default function Home() {
  return (
    <>
      <AuthenticatedRedirect />
      <MarketingLanding />
    </>
  );
}

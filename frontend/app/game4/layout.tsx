import { Game4Provider } from '../../components/game4/Game4Context';

export default function Game4Layout({ children }: { children: React.ReactNode }) {
  return <Game4Provider>{children}</Game4Provider>;
}
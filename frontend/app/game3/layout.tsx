import { Game3Provider } from '../../components/game3/Game3Context';

export default function Game3Layout({ children }: { children: React.ReactNode }) {
  return <Game3Provider>{children}</Game3Provider>;
}
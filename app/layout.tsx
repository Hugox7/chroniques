import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Chroniques & Dés — Vos aventures prennent vie',description:'Créez vos personnages et partagez vos campagnes de jeu de rôle.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}

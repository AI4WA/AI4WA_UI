import {Providers} from './provider';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
            />
        </head>
        <body>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
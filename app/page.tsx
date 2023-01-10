import Search from './Search';
// import Script from 'next/script';

export default async function Page() {
    return (
        <>
            <Search />
            {/* <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-D3BN2DRLFZ"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'G-D3BN2DRLFZ');
                `}
            </Script> */}
        </>
    )
}
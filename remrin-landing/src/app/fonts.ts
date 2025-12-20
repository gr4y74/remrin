import localFont from 'next/font/local';

export const tiemposHeadline = localFont({
    src: [
        {
            path: '../fonts/TestTiemposHeadline-Regular-BF66457a508e31a.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../fonts/TestTiemposHeadline-Medium-BF66457a509b4ec.otf',
            weight: '500',
            style: 'normal',
        },
    ],
    variable: '--font-tiempos',
    display: 'swap',
});

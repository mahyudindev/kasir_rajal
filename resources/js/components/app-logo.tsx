// Using the actual logo image

export default function AppLogo() {
    return (
        <div className="flex items-center">
            <img src="/images/logo.png" alt="Puskesmas Bojonegara" className="h-8 w-auto" />
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">SistemE-Rajal</span>
            </div>
        </div>
    );
}

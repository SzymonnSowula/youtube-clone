import Link from "next/link";
import { Youtube, ShieldCheck, Zap, Globe } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl border border-white/10 mb-2">
                        <Youtube className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white italic">
                        NEXT<span className="text-orange-500">TUBE</span>
                    </h1>
                    <p className="text-gray-400 text-lg">The next generation creator platform.</p>
                </div>

                <div className="bg-[#1F1F1F] border border-[#303030] rounded-[32px] p-8 shadow-2xl">
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Welcome back</h2>
                            <p className="text-gray-400 text-sm">Securely log in using your Whop account</p>
                        </div>

                        <Link
                            href="/api/auth/login"
                            className="flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://whop.com/logo.png" className="w-6 h-6 object-contain" alt="Whop" />
                            Sign in with Whop
                        </Link>

                        <div className="grid grid-cols-3 gap-4 py-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">Secure PKCE</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <Zap className="w-5 h-5 text-orange-500" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">Instant Access</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">Global Payouts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                    Powered by the official <span className="text-white font-medium">Whop SDK</span>.
                </p>

                <div className="pt-8 flex justify-center gap-8 text-gray-600">
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default opacity-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://supabase.com/dashboard/img/supabase-logo.svg" className="h-4" alt="Supabase" />
                        <span className="text-xs font-bold tracking-tighter">SUPABASE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

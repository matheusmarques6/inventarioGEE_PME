import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">GEE Inventory</h1>
          <p className="text-gray-600 mt-2">
            Entre para acessar seu inventário de emissões
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-sm normal-case",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}

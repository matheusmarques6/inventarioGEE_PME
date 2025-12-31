import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  BarChart3,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">GEE Inventory</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Recursos
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Preços
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground">
              Sobre
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Conformidade com SBCE e GHG Protocol
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Inventário de GEE
          <br />
          <span className="text-primary">Simplificado para PMEs</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Automatize o inventário de emissões de gases de efeito estufa da sua
          empresa. Conformidade com a Lei 15.042/2024 (SBCE), GHG Protocol e GRI.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Criar Conta Gratuita
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline">
              Ver Demonstração
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tudo que você precisa para seu inventário de carbono
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10 text-primary" />}
            title="Motor de Cálculo Automatizado"
            description="Cálculos precisos seguindo metodologias IPCC e GHG Protocol. Escopos 1, 2 e 3 completos."
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Relatórios Profissionais"
            description="Geração automática de relatórios GHG Protocol, GRI Standards e formato SBCE."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Conformidade Garantida"
            description="Atualizado com a Lei 15.042/2024 e regulamentações do Sistema Brasileiro de Comércio de Emissões."
          />
        </div>
      </section>

      {/* Scopes Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Cobertura Completa dos 3 Escopos
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ScopeCard
              scope={1}
              title="Escopo 1"
              subtitle="Emissões Diretas"
              items={[
                "Combustão estacionária",
                "Combustão móvel (frota)",
                "Emissões fugitivas",
                "Processos industriais",
                "Agropecuária e LULUCF",
              ]}
              color="bg-red-500"
            />
            <ScopeCard
              scope={2}
              title="Escopo 2"
              subtitle="Energia Indireta"
              items={[
                "Eletricidade comprada",
                "Fatores do grid brasileiro (MCTI)",
                "Energia térmica",
                "Location-based method",
                "Market-based method",
              ]}
              color="bg-blue-500"
            />
            <ScopeCard
              scope={3}
              title="Escopo 3"
              subtitle="Outras Indiretas"
              items={[
                "Transporte upstream/downstream",
                "Viagens a negócios",
                "Transporte de colaboradores",
                "Resíduos",
                "Bens e serviços adquiridos",
              ]}
              color="bg-green-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Pronto para começar seu inventário de carbono?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Junte-se a centenas de empresas que já estão gerenciando suas emissões
          de forma profissional e em conformidade com a legislação.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Começar Gratuitamente
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-semibold">GEE Inventory</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 GEE Inventory. Desenvolvido para o Sistema Brasileiro de
              Comércio de Emissões (SBCE).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function ScopeCard({
  scope,
  title,
  subtitle,
  items,
  color,
}: {
  scope: number;
  title: string;
  subtitle: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border shadow-sm">
      <div className={`${color} text-white p-4`}>
        <span className="text-sm font-medium opacity-80">{subtitle}</span>
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <Button variant="outline" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Termos de Uso</h1>
      </div>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Última atualização: 08 de Abril de 2025
        </p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar o Te Pesquisei, você concorda em cumprir e ficar vinculado aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá utilizar nossos serviços.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O Te Pesquisei é uma plataforma de pesquisa de mercado, pesquisas políticas e de opinião que utiliza tecnologia de ponta para coletar, analisar e apresentar dados precisos para empresas, organizações e pesquisadores.
        </p>

        <h2>3. Registro e Conta</h2>
        <p>
          Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrerem em sua conta.
        </p>

        <h2>4. Uso do Serviço</h2>
        <p>
          O usuário concorda em:
        </p>
        <ul>
          <li>Não usar o serviço para fins ilegais ou não autorizados;</li>
          <li>Não tentar acessar áreas restritas do sistema ou obter conteúdo por meios inadequados;</li>
          <li>Não coletar ou armazenar informações pessoais de outros usuários;</li>
          <li>Não interferir ou interromper os servidores ou redes conectadas ao serviço;</li>
          <li>Cumprir todas as leis aplicáveis relativas à realização de pesquisas.</li>
        </ul>

        <h2>5. Propriedade Intelectual</h2>
        <p>
          O conteúdo do Te Pesquisei, incluindo textos, gráficos, logotipos, ícones de botões, imagens, clipes de áudio, downloads digitais, compilações de dados e software, é propriedade da Gtoseg, CNPJ 12828011/0001-43, e está protegido por leis nacionais e internacionais de direitos autorais.
        </p>

        <h2>6. Pagamentos e Reembolsos</h2>
        <p>
          Os serviços são oferecidos no modelo de créditos pré-pagos. Os preços e condições de pagamento estão disponíveis no site. Ao adquirir créditos, você concorda com os termos de pagamento. Reembolsos podem ser solicitados em até 7 dias após a compra, desde que os créditos não tenham sido utilizados.
        </p>

        <h2>7. Limitação de Responsabilidade</h2>
        <p>
          O Te Pesquisei não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar o serviço, mesmo que tenhamos sido informados da possibilidade de tais danos.
        </p>

        <h2>8. Modificações dos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações serão efetivas imediatamente após a publicação dos termos revisados no site. O uso continuado do serviço após tais alterações constituirá seu consentimento para as modificações.
        </p>

        <h2>9. Lei Aplicável</h2>
        <p>
          Estes Termos de Uso serão regidos e interpretados de acordo com as leis brasileiras, sem considerar conflitos de disposições legais.
        </p>

        <h2>10. Informações de Contato</h2>
        <p>
          Para perguntas sobre estes Termos de Uso, entre em contato conosco através do e-mail contato@tepesquisei.shop ou pelo WhatsApp +5511951947025.
        </p>

        <div className="mt-10 border-t pt-6">
          <p className="text-muted-foreground">
            Gtoseg - CNPJ: 12828011/0001-43<br />
            E-mail: contato@tepesquisei.shop<br />
            Telefone: +5511951947025
          </p>
        </div>
      </div>
    </div>
  );
}
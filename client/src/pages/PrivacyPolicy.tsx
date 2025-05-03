import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="container py-10">
      <div className="flex items-center mb-8">
        <Button variant="outline" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      </div>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Última atualização: 08 de Abril de 2025
        </p>

        <h2>1. Introdução</h2>
        <p>
          A Gtoseg, CNPJ 12828011/0001-43, operando sob o nome Te Pesquisei, valoriza a privacidade de seus usuários e está comprometida com a proteção de seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações quando você utiliza nossa plataforma.
        </p>

        <h2>2. Informações que Coletamos</h2>
        <p>
          Podemos coletar os seguintes tipos de informações:
        </p>
        <ul>
          <li><strong>Informações de Registro:</strong> Nome, endereço de e-mail, número de telefone, e outras informações necessárias para criar sua conta.</li>
          <li><strong>Dados de Pagamento:</strong> Informações de cartão de crédito ou outros métodos de pagamento (processados por nossos prestadores de serviços de pagamento).</li>
          <li><strong>Dados de Pesquisa:</strong> Respostas a pesquisas, informações demográficas e outras informações fornecidas ao participar de pesquisas.</li>
          <li><strong>Informações de Uso:</strong> Como você interage com nosso serviço, incluindo páginas visitadas, tempo gasto e ações realizadas.</li>
          <li><strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador, endereço IP e identificadores de dispositivo.</li>
          <li><strong>Dados de Localização:</strong> Localização geográfica geral ou precisa, quando permitido.</li>
          <li><strong>Dados de Áudio:</strong> Gravações de voz quando participando de pesquisas telefônicas ou por voz.</li>
        </ul>

        <h2>3. Como Usamos Suas Informações</h2>
        <p>
          Utilizamos suas informações para:
        </p>
        <ul>
          <li>Fornecer, manter e melhorar nossos serviços;</li>
          <li>Processar transações e gerenciar sua conta;</li>
          <li>Conduzir pesquisas e análises de mercado;</li>
          <li>Comunicar sobre atualizações, promoções ou eventos relacionados ao serviço;</li>
          <li>Personalizar sua experiência e oferecer conteúdo e recursos relevantes;</li>
          <li>Proteger contra atividades fraudulentas ou ilegais;</li>
          <li>Cumprir com obrigações legais e regulatórias.</li>
        </ul>

        <h2>4. Compartilhamento de Informações</h2>
        <p>
          Podemos compartilhar suas informações nas seguintes situações:
        </p>
        <ul>
          <li>Com clientes e parceiros que contratam pesquisas (sempre de forma agregada e anônima, exceto quando você concordar explicitamente com o contrário);</li>
          <li>Com prestadores de serviços que nos auxiliam na operação do negócio;</li>
          <li>Em resposta a um processo legal ou quando acreditarmos que é necessário para proteção de nossos direitos ou segurança;</li>
          <li>Em caso de fusão, venda ou transferência de parte ou totalidade de nossos ativos (você será notificado);</li>
          <li>Com seu consentimento ou a seu pedido.</li>
        </ul>

        <h2>5. Seus Direitos e Escolhas</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras leis aplicáveis, você tem direitos relacionados a seus dados pessoais, incluindo:
        </p>
        <ul>
          <li>Acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais;</li>
          <li>Solicitar a portabilidade de seus dados;</li>
          <li>Opor-se ao processamento de seus dados pessoais em algumas circunstâncias;</li>
          <li>Retirar seu consentimento a qualquer momento para atividades de processamento baseadas em consentimento;</li>
          <li>Limitar o uso e divulgação de seus dados pessoais.</li>
        </ul>

        <h2>6. Segurança de Dados</h2>
        <p>
          Implementamos medidas de segurança técnicas, administrativas e físicas para proteger suas informações contra acesso não autorizado, perda, uso indevido ou alteração. No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico é 100% seguro.
        </p>

        <h2>7. Retenção de Dados</h2>
        <p>
          Mantemos seus dados pessoais pelo tempo necessário para atender aos fins para os quais foram coletados, cumprir com obrigações legais ou resolver disputas, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
        </p>

        <h2>8. Crianças</h2>
        <p>
          Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças. Se você acredita que coletamos informações de um menor, entre em contato conosco para que possamos tomar as medidas apropriadas.
        </p>

        <h2>9. Alterações nesta Política</h2>
        <p>
          Podemos atualizar esta política periodicamente. A versão mais recente será publicada em nosso site com a data da última atualização. Recomendamos que você revise esta política regularmente.
        </p>

        <h2>10. Contato</h2>
        <p>
          Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato conosco através do e-mail contato@tepesquisei.shop ou pelo WhatsApp +5511951947025.
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
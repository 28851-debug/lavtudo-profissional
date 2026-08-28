import { createFileRoute, Link } from "@tanstack/react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Nfc,
  QrCode,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  UserRoundCog,
  WashingMachine,
} from "lucide-react";
import slider1 from "@/assets/slider1.webp";
import slider2 from "@/assets/slider2.webp";
import slider3 from "@/assets/slider3.webp";
import slider4 from "@/assets/slider4.webp";
import { Nav } from "@/components/Nav";
import "@/styles/lavtudo.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LavTudo — Acompanhe sua lavagem em tempo real" },
      {
        name: "description",
        content:
          "LavTudo: acompanhe sua lavagem pelo QR Code impresso no cartão NFC permanente da máquina.",
      },
      { property: "og:title", content: "LavTudo — Acompanhe sua lavagem em tempo real" },
      {
        property: "og:description",
        content: "Um cartão NFC com QR Code fixo por máquina e atualizações em tempo real.",
      },
    ],
  }),
  component: Index,
});

const FLOW = [
  {
    icon: <Shirt />,
    label: "Deixe suas roupas",
    description: "A equipe registra o serviço e prepara tudo para você.",
  },
  {
    icon: <WashingMachine />,
    label: "Iniciamos o cuidado",
    description: "Sua lavagem segue as etapas do serviço escolhido.",
  },
  {
    icon: <Smartphone />,
    label: "Acompanhe pelo celular",
    description: "Leia o QR impresso no cartão NFC da máquina e veja o andamento ao vivo.",
  },
  {
    icon: <CheckCircle2 />,
    label: "Volte quando estiver pronta",
    description: "Você recebe a confirmação certa para fazer a retirada.",
  },
];

const SLIDES = [
  { src: slider1, alt: "Área de atendimento da lavanderia LavTudo" },
  { src: slider2, alt: "Estrutura e máquinas da lavanderia LavTudo" },
  { src: slider3, alt: "Serviço de lavagem profissional LavTudo" },
  { src: slider4, alt: "Lavanderia express LavTudo" },
];

function Index() {
  return (
    <div className="home-shell">
      <Nav />
      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-pill">
              <Sparkles size={16} /> Lavanderia express · 24 horas
            </div>
            <h1>Saiba quando sua roupa está pronta.</h1>
            <p>
              Cada máquina possui um cartão NFC permanente com QR Code impresso. Escaneie o QR ou
              aproxime o celular do mesmo cartão para acompanhar cada etapa ao vivo.
            </p>
            <div className="home-actions">
              <Link to="/scan" className="home-button primary">
                <Smartphone size={19} /> Ler cartão NFC / QR Code <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="home-button secondary">
                Como funciona
              </a>
            </div>
            <div className="home-trust-row">
              <span>
                <ShieldCheck size={17} /> Acesso permanente da máquina
              </span>
              <span>
                <Clock3 size={17} /> Atualização em tempo real
              </span>
              <span>
                <Nfc size={17} /> Cartão NFC com QR fixo
              </span>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="hero-glow" />
            <div
              className="phone-showcase"
              role="img"
              aria-label="Exemplo do acompanhamento no celular"
            >
              <div className="phone-frame">
                <span className="phone-speaker" aria-hidden="true" />
                <div className="phone-screen">
                  <div className="phone-brand">
                    <img src="/lavtudo-logo.webp" alt="" aria-hidden="true" />
                    <span>LavTudo</span>
                  </div>
                  <p>Acompanhamento ao vivo</p>
                  <h2>Lavadora 01</h2>
                  <div className="phone-status-chip">
                    <span /> Lavagem em andamento
                  </div>
                  <div className="phone-time">
                    <strong>32</strong>
                    <span>minutos restantes</span>
                  </div>
                  <div className="phone-progress">
                    <span />
                  </div>
                  <div className="phone-progress-labels">
                    <span>Início</span>
                    <strong>72%</strong>
                    <span>Pronta</span>
                  </div>
                  <div className="phone-next-step">
                    <Clock3 size={17} />
                    <div>
                      <span>Próxima etapa</span>
                      <strong>Enxágue</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-status status-one">
              <QrCode size={18} /> QR fixo no cartão NFC
            </div>
            <div className="floating-status status-two">
              <CheckCircle2 size={18} /> Status sincronizado
            </div>
          </div>
        </section>

        <section id="como-funciona" className="flow-section" aria-labelledby="flow-title">
          <div className="section-title">
            <p className="eyebrow">Experiência conectada</p>
            <h2 id="flow-title">Do balcão à retirada, tudo transparente</h2>
            <p>O funcionário atualiza o processo e o cliente vê a mudança no próprio celular.</p>
          </div>
          <ol className="home-flow">
            {FLOW.map((item, index) => (
              <li key={item.label}>
                <span className="flow-number">{index + 1}</span>
                <span className="flow-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="feature-section" aria-labelledby="features-title">
          <div className="section-title">
            <p className="eyebrow">Como funciona</p>
            <h2 id="features-title">Simples para o cliente. Completo para a equipe.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <div>
                <QrCode />
              </div>
              <h3>Um cartão por máquina</h3>
              <p>
                O QR Code fixo é impresso no cartão NFC da máquina. Os dois usam a mesma URL
                permanente em todos os ciclos.
              </p>
            </article>
            <article className="feature-card">
              <div>
                <Smartphone />
              </div>
              <h3>Status em tempo real</h3>
              <p>
                Lavagem, enxágue, centrifugação, secagem e retirada aparecem automaticamente no
                celular.
              </p>
            </article>
            <article className="feature-card">
              <div>
                <UserRoundCog />
              </div>
              <h3>Painel operacional</h3>
              <p>
                A equipe inicia ciclos, controla etapas, consulta o histórico e visualiza o QR
                permanente de cada máquina.
              </p>
            </article>
          </div>
        </section>

        <section className="gallery-section" aria-labelledby="gallery-title">
          <div className="section-title light">
            <p className="eyebrow">Conheça a LavTudo</p>
            <h2 id="gallery-title">Estrutura pensada para cuidar bem das suas roupas</h2>
          </div>
          <div className="home-slider">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={18}
              slidesPerView={1}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              rewind
              breakpoints={{ 760: { slidesPerView: 1.35, centeredSlides: true } }}
            >
              {SLIDES.map((slide, index) => (
                <SwiperSlide key={slide.src}>
                  <img src={slide.src} alt={slide.alt} loading={index === 0 ? "eager" : "lazy"} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        <section className="home-final-cta">
          <div>
            <p className="eyebrow">Já deixou suas roupas?</p>
            <h2>Leia o QR Code do cartão NFC da máquina e acompanhe em tempo real.</h2>
          </div>
          <Link to="/scan" className="home-button primary">
            Ler cartão da máquina <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="home-footer">
        <div className="footer-brand-block">
          <span className="footer-brand">
            <img src="/lavtudo-logo.webp" alt="" aria-hidden="true" />
            LavTudo
          </span>
          <p>Lavanderia Express 24 horas. Cuidado, praticidade e transparência.</p>
        </div>
        <nav className="footer-links" aria-label="Links do rodapé">
          <a href="#como-funciona">Como funciona</a>
          <Link to="/scan">Ler cartão NFC / QR Code</Link>
          <Link className="employee-footer-link" to="/admin">
            Área do funcionário
          </Link>
        </nav>
        <p className="footer-note">QR Code fixo impresso no cartão NFC de cada máquina.</p>
      </footer>
    </div>
  );
}

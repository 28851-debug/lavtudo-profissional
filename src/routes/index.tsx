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
          "LavTudo: lavanderia com acompanhamento por QR Code e NFC, atualizações em tempo real e retirada sem espera.",
      },
      { property: "og:title", content: "LavTudo — Acompanhe sua lavagem em tempo real" },
      {
        property: "og:description",
        content: "QR Code, NFC e acompanhamento de cada etapa da sua lavagem.",
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
    description: "Abra pelo QR Code ou NFC e veja o andamento ao vivo.",
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
            <h1>Deixe suas roupas. Acompanhe de onde estiver.</h1>
            <p>
              Enquanto cuidamos de cada peça, você acompanha lavagem, enxágue, centrifugação e
              secagem pelo celular — sem precisar permanecer na lavanderia.
            </p>
            <div className="home-actions">
              <Link to="/scan" className="home-button primary">
                <Smartphone size={19} /> Acompanhar minha lavagem <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="home-button secondary">
                Como funciona
              </a>
            </div>
            <div className="home-trust-row">
              <span>
                <ShieldCheck size={17} /> Identificador único
              </span>
              <span>
                <Clock3 size={17} /> Atualização em tempo real
              </span>
              <span>
                <Nfc size={17} /> QR Code e NFC
              </span>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="hero-glow" />
            <div className="washer-stage">
              <img
                src="/lavadora-realista.webp"
                alt="Máquina de lavar frontal moderna em funcionamento"
                fetchPriority="high"
              />
              <span className="washer-drum-motion" aria-hidden="true" />
            </div>
            <div className="floating-status status-one">
              <span /> Lavagem em andamento
            </div>
            <div className="floating-status status-two">
              <CheckCircle2 size={18} /> Atualização no celular
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
              <h3>Acesso imediato</h3>
              <p>
                Cada lavagem recebe uma URL própria, disponível no QR Code e pronta para uma
                etiqueta NFC.
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
                A equipe cria pedidos, controla etapas, consulta histórico e compartilha o
                acompanhamento.
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
            <h2>Acompanhe agora pelo número da lavagem.</h2>
          </div>
          <Link to="/scan" className="home-button primary">
            Abrir acompanhamento <ArrowRight size={18} />
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
          <Link to="/scan">Acompanhar lavagem</Link>
          <Link className="employee-footer-link" to="/admin">
            Área do funcionário
          </Link>
        </nav>
        <p className="footer-note">Acesso rápido por QR Code ou etiqueta NFC.</p>
      </footer>
    </div>
  );
}

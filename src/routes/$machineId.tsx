import { createFileRoute, notFound } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { MachineDashboard, MachineSkeleton } from "@/components/machine/MachineDashboard";
import { useMachines } from "@/context/MachineContext";
import "@/styles/app.css";

const VALID_IDS = new Set(["maq1", "maq2", "sec1", "sec2"]);

export const Route = createFileRoute("/$machineId")({
  beforeLoad: ({ params }) => {
    if (!VALID_IDS.has(params.machineId)) throw notFound();
  },
  head: ({ params }) => {
    const validMachine = VALID_IDS.has(params.machineId);
    const pageTitle = validMachine
      ? `Máquina ${params.machineId.toUpperCase()} — LavTudo`
      : "Página não encontrada — LavTudo";
    return {
      meta: [
        { title: pageTitle },
        {
          name: "description",
          content: validMachine
            ? `Acompanhe em tempo real o ciclo da máquina ${params.machineId.toUpperCase()}.`
            : "O endereço informado não corresponde a um equipamento LavTudo.",
        },
        { property: "og:title", content: pageTitle },
        {
          property: "og:description",
          content: "Painel em tempo real do seu ciclo de lavagem.",
        },
      ],
    };
  },
  component: MachinePage,
  notFoundComponent: () => (
    <div className="lav-shell">
      <Nav />
      <div className="container-page">
        <h1>Máquina não encontrada</h1>
        <p style={{ color: "#d5ccff", marginTop: 8 }}>
          A URL informada não corresponde a nenhuma máquina cadastrada.
        </p>
      </div>
    </div>
  ),
});

function MachinePage() {
  const { machineId } = Route.useParams();
  const { getMachine, hydrated } = useMachines();
  const machine = getMachine(machineId);

  return (
    <div className="lav-shell">
      <Nav />
      {!hydrated || !machine ? <MachineSkeleton /> : <MachineDashboard machine={machine} />}
    </div>
  );
}

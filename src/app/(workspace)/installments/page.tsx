import { listCards } from "@/modules/cards/infrastructure/card-service";
import { listInstallments } from "@/modules/installments/infrastructure/installment-service";
import InstallmentsRouteClient from "./installments-route-client";

export default async function InstallmentsRoute() {
  const [plans, cards] = await Promise.all([listInstallments(), listCards()]);
  return (
    <InstallmentsRouteClient
      key={`${plans.map(({ id, paidInstallments }) => `${id}:${paidInstallments}`).join(",")}:${cards.map(({ id }) => id).join(",")}`}
      initialPlans={plans}
      cards={cards}
    />
  );
}

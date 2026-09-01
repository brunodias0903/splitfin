import { listCards } from "@/modules/cards/infrastructure/card-service";
import CardsRouteClient from "./cards-route-client";

export default async function CardsRoute() {
  const cards = await listCards();
  return <CardsRouteClient key={cards.map(({ id }) => id).join(",")} initialCards={cards} />;
}

import type { CitySubject } from "@mtct/core";
import { redirect } from "next/navigation";
import { isCity } from "./city-names";
import { kidStudent } from "./student";
import { kidUiMode } from "./ui-mode";

/**
 * The guard of the city screens: city UI on, a real city, the signed-in child. Anything else goes
 * back to a place the child knows, never to an error page.
 */
export async function cityKid(cityParam: string) {
  if (kidUiMode() !== "city") redirect("/kid/home");
  if (!isCity(cityParam)) redirect("/kid/city");
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  return { student, city: cityParam as CitySubject };
}

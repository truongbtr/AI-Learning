import { cookies } from "next/headers";
import { kidUiMode, UI_COOKIE } from "./ui-mode";

/** The kid UI for this request: this device's cookie first, then `KID_UI`. */
export async function currentKidUi() {
  const store = await cookies();
  return kidUiMode(process.env, store.get(UI_COOKIE)?.value);
}

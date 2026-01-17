type FormState = Record<string, string | undefined>;

let formStorageKey = "maparea-form";
let form = document.querySelector("form")!;

let apikeyInput = form.querySelector<HTMLInputElement>('input[name="apikey"]')!;
let langInput = form.querySelector<HTMLInputElement>('input[name="lang"]')!;

function reset() {
  try {
    localStorage.removeItem("maparea#map");
  } catch {}
}

function getFormState() {
  let state = Object.fromEntries(new FormData(form)) as FormState;

  for (let [k, v] of Object.entries(state)) {
    if (v === "") delete state[k];
  }

  return state;
}

function getStoredState() {
  try {
    return JSON.parse(
      localStorage.getItem(formStorageKey) ?? "{}",
    ) as FormState;
  } catch {}
}

function setState(state: FormState) {
  apikeyInput.value = state.apikey ?? "";
  langInput.value = state.lang ?? "";

  try {
    localStorage.setItem(formStorageKey, JSON.stringify(state));
  } catch {}
}

export function initTestForm() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setState(getFormState());

    window.location.reload();
  });

  form.querySelector(".clear")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(formStorageKey);
    } catch {}

    apikeyInput.value = "";
    langInput.value = "";

    window.location.reload();
  });

  form.querySelector(".reset")?.addEventListener("click", () => {
    reset();
    window.location.reload();
  });

  let formState = {
    ...getStoredState(),
    ...getFormState(),
  };

  setState(formState);

  return formState;
}

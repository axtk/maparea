type FormState = Record<string, string>;

let formStorageKey = "maparea-form";
let form = document.querySelector("form")!;

let apikeyInput = form.querySelector<HTMLInputElement>('input[name="apikey"]')!;
let langInput = form.querySelector<HTMLInputElement>('input[name="lang"]')!;

function toFormState(x: FormData | URLSearchParams) {
  let value = Object.fromEntries(x) as FormState;

  for (let [k, v] of Object.entries(value)) {
    if (v === "") delete value[k];
  }

  return value;
}

function getURLState() {
  return toFormState(new URL(window.location.href).searchParams);
}

function getFormState() {
  return toFormState(new FormData(form));
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

  let search = new URLSearchParams(state).toString();

  if (search && window.history) window.history.pushState({}, "", `/?${search}`);
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

    window.location.assign("/");
  });

  let formState = {
    ...getStoredState(),
    ...getURLState(),
  };

  setState(formState);

  return formState;
}

export function initTestFormReset(callback: () => void) {
  form.querySelector(".reset")?.addEventListener("click", () => {
    callback();
  });
}

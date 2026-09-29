import { startTransition, type FormEvent } from "react";

/**
 * onSubmit handler that dispatches a useActionState action without React's
 * automatic form reset. Needed for forms with controlled <select>s: the reset
 * puts them back on their first option while React state keeps the old value,
 * so a resubmit after a validation error would send the wrong choice.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => action(formData));
  };
}

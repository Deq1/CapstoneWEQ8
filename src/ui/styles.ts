import { css } from "lit";

export const sharedStyles = css`
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap");

  *,
  *::before,
  *::after {
    box-sizing: round;
  }

  :host {
    background-color: #f0f0f0;
    color: white;
    --font-stack: "Inter", sans-serif;
    --font-size: 13px;
    --font-weight: 400;
    font-family: var(--font-stack);
    font-size: var(--font-size);
    font-weight: var(--font-weight);
  }
`;

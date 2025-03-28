import React from 'react';
import type { IconProps } from '../types';

export const StatusLocked = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <rect
        x=".5"
        y=".5"
        width="15"
        height="15"
        rx="7.5"
        fill="#0D0E24"
        stroke="#7BB2CE"
      />
      <path
        d="M5.84 12h4.365c.605 0 1.09-.506 1.09-1.125V7.5c0-.619-.485-1.125-1.09-1.125V5.25c0-1.243-.977-2.25-2.182-2.25C6.817 3 5.84 4.007 5.84 5.25v1.125c-.606 0-1.091.506-1.091 1.125v3.375c0 .619.485 1.125 1.09 1.125zm.874-6.75c0-.748.583-1.35 1.309-1.35.725 0 1.309.608 1.309 1.35v1.125H6.714V5.25z"
        fill="#FFF"
        fillRule="nonzero"
      />
      <path d="M0 0h16v16H0z" />
    </g>
  </svg>
);

export default StatusLocked;

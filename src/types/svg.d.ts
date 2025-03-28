
declare module "*.svg" {
  import React from "react";
  
  const svg: React.FC<React.SVGProps<SVGSVGElement>>;
  export default svg;
  
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}

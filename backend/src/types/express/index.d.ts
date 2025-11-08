/*
This is a .d.ts file 

We're extending the existing Response interface 
in the Express namespace

To achieve this, we need to use the declare keyword 
to interact with existing library types
*/
declare namespace Express {
  export interface Response {
    sseWrite: (data: any) => void;
    sseEnd: (data: any) => void;
    sseError: (data: any) => void;
  }
}

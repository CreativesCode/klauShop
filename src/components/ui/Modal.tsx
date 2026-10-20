import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import CloseButton from "./CloseButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  header: string;
  children: ReactNode;
  containerClassName?: string;
};

function Modal({ header, containerClassName, children }: Props) {
  return (
    <section
      className={cn(
        "fixed inset-0 z-50 h-full w-full overflow-y-auto bg-ink/40",
      )}
    >
      <Card
        className={cn(
          "relative max-w-full inset-0 md:inset-20 md:max-w-2xl lg:max-w-[960px] xl:max-w-[1080px] top-20 mx-auto p-5 container mb-10 min-h-[480px] w-full rounded-[24px] border-line bg-white shadow-2xl",
          containerClassName,
        )}
      >
        <CardHeader className="p-0 mb-3 md:mb-5">
          <h1 className="text-lg font-extrabold leading-5 tracking-tight text-ink">
            {header}
          </h1>
          <CloseButton />
        </CardHeader>

        <CardContent className="relative p-0 mb-5 overflow-hidden">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export default Modal;

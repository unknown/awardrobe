import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@ui/Button";
import { twMerge } from "tailwind-merge";

export default async function IndexPage() {
  return (
    <Fragment>
      <section className="py-12 md:py-40 md:pb-20 lg:py-60 lg:pb-32">
        <div className="container flex max-w-3xl flex-col items-center text-center">
          <div className="flex flex-col gap-6">
            <span className="mx-auto inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium">
              Tracking 5,000+ products
            </span>
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-7xl">
              Shop for clothes smarter
            </h1>
            <p className="text-muted-foreground sm:text-lg md:text-xl">
              Research price history and stock availability to save money.
            </p>
          </div>
          <div className="space-x-4 pt-14">
            <Link
              href="/home"
              className={twMerge(buttonVariants({ size: "lg" }), "h-12 px-8 text-sm sm:text-base")}
            >
              Get started
            </Link>
          </div>
          <div className="pt-12 md:pt-20 lg:pt-44">
            <div className="w-100 flex max-w-lg flex-wrap justify-center gap-x-12 gap-y-8">
              <p className="text-muted-foreground w-full text-sm sm:text-base">
                Tracking your favorite brands, including
              </p>
              <a href="https://www.uniqlo.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/uniqlo.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Uniqlo logo"
                />
              </a>
              <a href="https://www.abercrombie.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/abercrombie.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Abercrombie & Fitch logo"
                />
              </a>
              <a href="https://www.jcrew.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/jcrew.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="J.Crew logo"
                />
              </a>
              <a href="https://www.zara.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/zara.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Zara logo"
                />
              </a>
              <a href="https://www.kith.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/kith.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Kith logo"
                />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Fragment>
  );
}

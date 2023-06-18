import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const uniqlo = await prisma.store.upsert({
    where: { handle: "uniqlo-us" },
    update: {},
    create: {
      name: "Uniqlo US",
      handle: "uniqlo-us",
      externalUrl: "https://www.uniqlo.com/",
    },
  });

  const productCodes = [
    "E457264-000",
    "E457967-000",
    "E453056-000",
    "E457263-000",
    "E457212-000",
    "E455498-000",
  ];
  for (const productCode of productCodes) {
    await addProduct(uniqlo.id, productCode);
  }
}

async function addProduct(storeId: string, productCode: string) {
  const { name, details } = await getProductDetails(productCode);

  await prisma.product.upsert({
    where: {
      storeId_productCode: {
        storeId,
        productCode,
      },
    },
    update: {},
    create: {
      productCode,
      name,
      storeId,
      variants: {
        createMany: {
          data: details.map(({ color, size }) => ({
            style: color,
            size,
          })),
        },
      },
    },
  });
}

type UniqloType = {
  code: string;
  displayCode: string;
  name: string;
};

// TODO: sync with monitors code?
async function getProductDetails(productCode: string) {
  const pricesEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/l2s?withPrices=true&withStocks=true&httpFailure=true`;
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;

  const [pricesData, detailsData] = await Promise.all([
    (await fetch(pricesEndpoint)).json(),
    (await fetch(detailsEndpoint)).json(),
  ]);

  // TODO: type these result objects with zod?
  const { l2s }: { l2s: { color: UniqloType; size: UniqloType }[] } = pricesData.result;

  const { name, colors, sizes }: { name: string; colors: UniqloType[]; sizes: UniqloType[] } =
    detailsData.result;

  // used to map display codes to human-readable names (e.g. "08" -> "08 Dark Gray")
  const colorsRecord = colors.reduce((colors, color) => {
    colors[color.displayCode] = toTitleCase(`${color.displayCode} ${color.name}`);
    return colors;
  }, {} as Record<string, string>);
  const sizesRecord = sizes.reduce((sizes, size) => {
    sizes[size.displayCode] = size.name;
    return sizes;
  }, {} as Record<string, string>);

  const details: { color: string; size: string }[] = l2s.map(({ color, size }) => {
    const colorDisplayCode: string = color.displayCode.toString();
    const sizeDisplayCode: string = size.displayCode.toString();

    return {
      color: colorsRecord[colorDisplayCode],
      size: sizesRecord[sizeDisplayCode],
    };
  });

  return { name, details };
}

function toTitleCase(text: string) {
  return text.replace(/\w\S*/g, (substring) => {
    return substring.charAt(0).toUpperCase() + substring.slice(1).toLowerCase();
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

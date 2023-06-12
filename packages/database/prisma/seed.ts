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

  await Promise.all([
    addProduct(uniqlo.id, "E457264-000"),
    addProduct(uniqlo.id, "E457967-000"),
    addProduct(uniqlo.id, "E453056-000"),
    addProduct(uniqlo.id, "E457263-000"),
    addProduct(uniqlo.id, "E457212-000"),
    addProduct(uniqlo.id, "E455498-000"),
  ]);
}

async function addProduct(storeId: string, productCode: string) {
  const { name, colors, sizes } = await getDetails(productCode);

  await prisma.product.create({
    data: {
      productCode,
      name,
      storeId,
      variant: {
        createMany: {
          data: [
            ...Object.values(colors).map((color) => ({
              optionType: "Color",
              value: color,
            })),
            ...Object.values(sizes).map((size) => ({
              optionType: "Size",
              value: size,
            })),
          ],
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

async function getDetails(productCode: string) {
  const detailsEndpoint = `https://www.uniqlo.com/us/api/commerce/v5/en/products/${productCode}/price-groups/00/details?includeModelSize=false&httpFailure=true`;
  const detailsResponse = await fetch(detailsEndpoint);
  const { name, colors, sizes } = (await detailsResponse.json()).result;

  const colorsRecord: Record<string, string> = {};
  colors.forEach((color: UniqloType) => {
    colorsRecord[color.displayCode] = toTitleCase(`${color.displayCode} ${color.name}`);
  });
  const sizesRecord: Record<string, string> = {};
  sizes.forEach((size: UniqloType) => {
    sizesRecord[size.displayCode] = size.name;
  });

  return { name, colors: colorsRecord, sizes: sizesRecord };
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

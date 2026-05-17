import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = Date.now();
const inSeconds = (s: number) => new Date(now + s * 1000);

const stations = [
  {
    name: 'WEG Shopping Pelotas',
    lat: -31.7716,
    lng: -52.3325,
    address: 'R. Sen. Joaquim Assumpção, 100',
    neighborhood: 'Areal',
    plugs: [
      { connectorType: 'CCS2', powerKW: 60, status: 'Disponível', pricePerKWh: 1.45, priceType: 'Pago' },
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Ocupado', pricePerKWh: 1.45, priceType: 'Pago' },
    ],
  },
  {
    name: 'Tupinambá Centro Histórico',
    lat: -31.767,
    lng: -52.3389,
    address: 'Pç. Cel. Pedro Osório, 102',
    neighborhood: 'Centro',
    plugs: [
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Ocupado', pricePerKWh: 1.39, priceType: 'Pago' },
    ],
  },
  {
    name: 'EZVolt UFPel Anglo',
    lat: -31.7649,
    lng: -52.3373,
    address: 'R. Gomes Carneiro, 1',
    neighborhood: 'Centro',
    plugs: [
      { connectorType: 'CCS2', powerKW: 50, status: 'Disponível', pricePerKWh: 0, priceType: 'Gratuito' },
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Disponível', pricePerKWh: 0, priceType: 'Gratuito' },
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Disponível', pricePerKWh: 0, priceType: 'Gratuito' },
    ],
  },
  {
    name: 'WEG Av. Bento Gonçalves',
    lat: -31.7541,
    lng: -52.3225,
    address: 'Av. Bento Gonçalves, 4500',
    neighborhood: 'Três Vendas',
    plugs: [
      { connectorType: 'CCS2', powerKW: 150, status: 'Disponível', pricePerKWh: 1.89, priceType: 'Pago' },
      { connectorType: 'CCS2', powerKW: 150, status: 'Ocupado', pricePerKWh: 1.89, priceType: 'Pago' },
      {
        connectorType: 'Tipo 2',
        powerKW: 22,
        status: 'Reservado',
        pricePerKWh: 1.49,
        priceType: 'Pago',
        reservedUntil: inSeconds(12),
      },
      { connectorType: 'CHAdeMO', powerKW: 50, status: 'Em Manutenção', pricePerKWh: 1.99, priceType: 'Pago' },
    ],
  },
  {
    name: 'Raízen Power BR-392',
    lat: -31.743,
    lng: -52.3115,
    address: 'BR-392 km 100',
    neighborhood: 'Centro Industrial',
    plugs: [
      { connectorType: 'CCS2', powerKW: 150, status: 'Disponível', pricePerKWh: 2.1, priceType: 'Pago' },
      { connectorType: 'CCS2', powerKW: 150, status: 'Disponível', pricePerKWh: 2.1, priceType: 'Pago' },
      { connectorType: 'CHAdeMO', powerKW: 50, status: 'Disponível', pricePerKWh: 1.99, priceType: 'Pago' },
      { connectorType: 'CHAdeMO', powerKW: 50, status: 'Ocupado', pricePerKWh: 1.99, priceType: 'Pago' },
    ],
  },
  {
    name: 'EZVolt Av. Fernando Osório',
    lat: -31.7889,
    lng: -52.3398,
    address: 'Av. Fernando Osório, 1850',
    neighborhood: 'Três Vendas',
    plugs: [
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Ocupado', pricePerKWh: 0, priceType: 'Gratuito' },
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Ocupado', pricePerKWh: 0, priceType: 'Gratuito' },
    ],
  },
  {
    name: 'Tupinambá Praia do Laranjal',
    lat: -31.7768,
    lng: -52.2236,
    address: 'Av. dos Pescadores, 1200',
    neighborhood: 'Laranjal',
    plugs: [
      { connectorType: 'CCS2', powerKW: 50, status: 'Em Manutenção', pricePerKWh: 1.89, priceType: 'Pago' },
      { connectorType: 'Tipo 2', powerKW: 22, status: 'Em Manutenção', pricePerKWh: 1.49, priceType: 'Pago' },
    ],
  },
  {
    name: 'WEG Centro Industrial',
    lat: -31.748,
    lng: -52.314,
    address: 'R. Almirante Barroso, 200',
    neighborhood: 'Centro Industrial',
    plugs: [
      {
        connectorType: 'CCS2',
        powerKW: 60,
        status: 'Reservado',
        pricePerKWh: 1.65,
        priceType: 'Pago',
        reservedUntil: inSeconds(8),
      },
    ],
  },
];

async function main() {
  console.log('Limpando banco...');
  await prisma.plug.deleteMany();
  await prisma.station.deleteMany();

  console.log('Criando estações...');
  for (const s of stations) {
    const { plugs, ...rest } = s;
    const created = await prisma.station.create({
      data: { ...rest, plugs: { create: plugs } },
      include: { plugs: true },
    });
    console.log(`  -> ${created.name} (${created.plugs.length} plug${created.plugs.length > 1 ? 's' : ''})`);
  }

  const total = await prisma.plug.count();
  console.log(`Seed concluído: ${stations.length} estações, ${total} plugs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

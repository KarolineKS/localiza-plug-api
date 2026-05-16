import { PrismaClient, StationStatus, StationConnector, StationPrice } from '@prisma/client';

const prisma = new PrismaClient();

const stations = [
  {
    id: 'pel_001',
    name: 'WEG Shopping Pelotas',
    lat: -31.7716,
    lng: -52.3325,
    address: 'R. Sen. Joaquim Assumpção, 100',
    neighborhood: 'Areal',
    status: StationStatus.DISPONIVEL,
    connector: StationConnector.CCS2,
    powerKW: 60,
    price: StationPrice.PAGO,
  },
  {
    id: 'pel_002',
    name: 'Tupinambá Centro Histórico',
    lat: -31.767,
    lng: -52.3389,
    address: 'Pç. Cel. Pedro Osório, 102',
    neighborhood: 'Centro',
    status: StationStatus.OCUPADO,
    connector: StationConnector.TIPO_2,
    powerKW: 22,
    price: StationPrice.PAGO,
  },
  {
    id: 'pel_003',
    name: 'EZVolt UFPel Anglo',
    lat: -31.7649,
    lng: -52.3373,
    address: 'R. Gomes Carneiro, 1',
    neighborhood: 'Centro',
    status: StationStatus.DISPONIVEL,
    connector: StationConnector.CCS2,
    powerKW: 50,
    price: StationPrice.GRATUITO,
  },
  {
    id: 'pel_004',
    name: 'WEG Av. Bento Gonçalves',
    lat: -31.7541,
    lng: -52.3225,
    address: 'Av. Bento Gonçalves, 4500',
    neighborhood: 'Três Vendas',
    status: StationStatus.DISPONIVEL,
    connector: StationConnector.CCS2,
    powerKW: 150,
    price: StationPrice.PAGO,
  },
  {
    id: 'pel_005',
    name: 'Raízen Power BR-392',
    lat: -31.743,
    lng: -52.3115,
    address: 'BR-392 km 100',
    neighborhood: 'Centro Industrial',
    status: StationStatus.DISPONIVEL,
    connector: StationConnector.CHADEMO,
    powerKW: 150,
    price: StationPrice.PAGO,
  },
  {
    id: 'pel_006',
    name: 'EZVolt Av. Fernando Osório',
    lat: -31.7889,
    lng: -52.3398,
    address: 'Av. Fernando Osório, 1850',
    neighborhood: 'Três Vendas',
    status: StationStatus.OCUPADO,
    connector: StationConnector.TIPO_2,
    powerKW: 22,
    price: StationPrice.GRATUITO,
  },
  {
    id: 'pel_007',
    name: 'Tupinambá Praia do Laranjal',
    lat: -31.7768,
    lng: -52.2236,
    address: 'Av. dos Pescadores, 1200',
    neighborhood: 'Laranjal',
    status: StationStatus.EM_MANUTENCAO,
    connector: StationConnector.CCS2,
    powerKW: 50,
    price: StationPrice.PAGO,
  },
  {
    id: 'pel_008',
    name: 'WEG Centro Industrial',
    lat: -31.748,
    lng: -52.314,
    address: 'R. Almirante Barroso, 200',
    neighborhood: 'Centro Industrial',
    status: StationStatus.RESERVADO,
    connector: StationConnector.CCS2,
    powerKW: 60,
    price: StationPrice.PAGO,
  },
];

async function main() {
  console.log('Seeding eletropostos...');

  for (const station of stations) {
    await prisma.station.upsert({
      where: { id: station.id },
      update: station,
      create: station,
    });
    console.log(`  -> ${station.id}: ${station.name}`);
  }

  console.log(`Seed concluído: ${stations.length} eletropostos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

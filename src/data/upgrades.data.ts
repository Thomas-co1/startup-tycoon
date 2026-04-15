import { Upgrade } from '../models/upgrade.model';

export const UPGRADES: Upgrade[] = [
  {
    id: 'dev-junior',
    name: 'Dev Junior',
    baseCost: 10,
    incomePerSecondGain: 1,
    count: 0,
    description: 'Un développeur junior pour coder les features basiques'
  },
  {
    id: 'dev-senior',
    name: 'Dev Senior',
    baseCost: 50,
    incomePerSecondGain: 3,
    count: 0,
    description: 'Un développeur expérimenté qui triple votre productivité'
  },
  {
    id: 'serveur-cloud',
    name: 'Serveur Cloud',
    baseCost: 120,
    incomePerSecondGain: 5,
    count: 0,
    description: 'Infrastructure cloud pour scaler votre application'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    baseCost: 200,
    incomePerSecondGain: 7,
    count: 0,
    description: 'Campagne marketing pour attirer plus de clients'
  },
  {
    id: 'cto',
    name: 'CTO',
    baseCost: 500,
    incomePerSecondGain: 15,
    count: 0,
    description: 'Un directeur technique qui optimise toute votre stack'
  },
  {
    id: 'data-center',
    name: 'Data Center',
    baseCost: 2000,
    incomePerSecondGain: 50,
    count: 0,
    description: 'Votre propre data center pour une infrastructure massive'
  }
];

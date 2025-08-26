import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type ProfileInput = {
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
  budget?: number; // <-- in pounds (e.g., 200)
};

type Product = {
  id: string;
  category: 'top' | 'bottom' | 'shoe' | 'accessory';
  name: string;
  price_pennies: number; // <-- stored in pennies (e.g., £45 -> 4500)
  color_family: string;
  sizes: string[];
  image_url?: string;
};

function loadCatalog(): Product[] {
  const catalogPath = path.join(process.cwd(), 'src', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`catalog.json not found at: ${catalogPath}`);
  }
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const json = JSON.parse(raw);
  return json.products as Product[];
}

function fits(p: Product, prof: ProfileInput) {
  if (p.category === 'top' && prof.topSize) return p.sizes.includes(prof.topSize);
  if (p.category === 'bottom' && prof.bottomSize) return p.sizes.includes(prof.bottomSize);
  if (p.category === 'shoe' && prof.shoeSize) return p.sizes.includes(prof.shoeSize);
  return true;
}

function harmonious(a: string, b: string) {
  const neutral = new Set(['black', 'white', 'grey', 'navy', 'tan', 'brown']);
  if (neutral.has(a) || neutral.has(b)) return true;
  const comp: Record<string, string> = { blue: 'orange', red: 'green', yellow: 'purple', green: 'red', orange: 'blue', purple: 'yellow' };
  return comp[a] === b;
}

@Controller('outfits')
export class OutfitsController {
  @Post('generate')
  generate(@Body() body: ProfileInput) {
    try {
      const prof: ProfileInput = {
        topSize: body?.topSize,
        bottomSize: body?.bottomSize,
        shoeSize: body?.shoeSize,
        budget: body?.budget && Number(body.budget) > 0 ? Number(body.budget) : 200, // pounds
      };

      const BUDGET_PENNIES = Math.round((prof.budget ?? 200) * 100); // convert to pennies

      const all = loadCatalog();
      const tops = all.filter(p => p.category === 'top' && fits(p, prof));
      const bottoms = all.filter(p => p.category === 'bottom' && fits(p, prof));
      const shoes = all.filter(p => p.category === 'shoe' && fits(p, prof));
      const accs = all.filter(p => p.category === 'accessory');

      const candidates: any[] = [];
      for (const b of bottoms) {
        for (const t of tops) {
          if (!harmonious(b.color_family, t.color_family)) continue;
          for (const s of shoes) {
            if (!harmonious(t.color_family, s.color_family)) continue;
            const base = [t, b, s];
            let total = base.reduce((sum, p) => sum + p.price_pennies, 0);
            if (total > BUDGET_PENNIES) continue;
            // add an accessory if it fits
            const a = accs.find(x => total + x.price_pennies <= BUDGET_PENNIES);
            const items = a ? [...base, a] : base;
            total = items.reduce((sum, p) => sum + p.price_pennies, 0);
            candidates.push({
              total_price: total,
              items: items.map(p => ({
                id: p.id,
                category: p.category,
                name: p.name,
                price_pennies: p.price_pennies,
                image_url: p.image_url ?? null,
              })),
            });
          }
        }
      }

      candidates.sort((x, y) => y.total_price - x.total_price);
      const top3 = candidates.slice(0, 3);
      return { outfits: top3 };
    } catch (err: any) {
      console.error('Outfit generation error:', err?.message);
      throw new HttpException(err?.message || 'Internal error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

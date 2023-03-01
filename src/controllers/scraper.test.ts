import { convertPriceStringToNumber, Package, PricingFrequency, scrape } from './scraper';

describe('convertPriceStringToNumber', () => {
    it('should convert a price string to a number', () => {
        expect(convertPriceStringToNumber('£10.99')).toEqual(10.99);
        expect(convertPriceStringToNumber('£2.99')).toEqual(2.99);
    });

    it('throws an error for invalid input', () => {
        expect(() => convertPriceStringToNumber('')).toThrow('No string passed.');
    });
});

describe('scrape', () => {
    const mockData = `
    <div class="row-subscriptions">
      <div class="package">
        <div class="header"><h3>Option 1</h3></div>
        <div class="package-description">Description 1</div>
        <div class="package-price"><span class="price-big">£108.00</span> Per Year
                <p>Save £11.90 on the monthly price</p>
        </div>
      </div>
      <div class="package">
        <div class="header"><h3>Option 2</h3></div>
        <div class="package-description">Description 2</div>
        <div class="package-price"><span class="price-big">£15.99</span> Per Month</div>
      </div>
    </div>
  `;

    const expectedPackages: Package[] = [
        {
            description: 'Description 2',
            frequency: PricingFrequency.monthly,
            monthlyPrice: 15.99,
            optionTitle: 'Option 2',
            price: '£15.99',
            yearlyPrice: 191.88,
        },
        {
            description: 'Description 1',
            discount: 'Save £11.90 on the monthly price',
            frequency: PricingFrequency.yearly,
            monthlyPrice: 9,
            optionTitle: 'Option 1',
            price: '£108.00',
            yearlyPrice: 108,
        },
    ];

    it('should scrape the packages from the HTML', async () => {
        const packages = await scrape({ data: mockData });
        expect(packages).toEqual(expectedPackages);
    });

    it('should sort packages by yearlyPrice', async () => {
        const packages = await scrape({ data: mockData, sortKey: 'yearlyPrice', sortAsc: true });
        const expectedSortedPackages = expectedPackages.sort((a, b) => a.yearlyPrice! - b.yearlyPrice!);
        expect(packages).toEqual(expectedSortedPackages);
    });

    it('should sort packages by monthlyPrice', async () => {
        const packages = await scrape({ data: mockData, sortKey: 'monthlyPrice', sortAsc: true });
        const expectedSortedPackages = expectedPackages.sort((a, b) => a.monthlyPrice! - b.monthlyPrice!);
        expect(packages).toEqual(expectedSortedPackages);
    });

    it('should sort packages in descending order', async () => {
        const packages = await scrape({ data: mockData, sortKey: 'yearlyPrice' });
        const expectedSortedPackages = expectedPackages.sort((a, b) => b.yearlyPrice! - a.yearlyPrice!);
        expect(packages).toEqual(expectedSortedPackages);
    });
});

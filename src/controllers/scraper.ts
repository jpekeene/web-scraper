import axios from 'axios';
import * as cheerio from 'cheerio';

export enum PricingFrequency {
    yearly = 'Yearly',
    monthly = 'Monthly',
}

export interface Package {
    optionTitle: string;
    description: string;
    price: string;
    frequency: PricingFrequency | undefined;
    discount?: string;
    yearlyPrice?: number;
    monthlyPrice?: number;
}

export const convertPriceStringToNumber = (priceString: string): number => {
    if (!priceString) {
        throw new Error('No string passed.');
    }
    // Remove the pound sign.
    const priceWithoutPound = priceString.replace(/£/g, '');

    // Convert to a numeric value with two decimal places.
    return parseFloat(Number(priceWithoutPound).toFixed(2));
};

export const getFrequency = (priceText: string): PricingFrequency | undefined => {
    const perYearString = 'Per Year';
    const perMonthString = 'Per Month';
    return priceText.includes(perMonthString)
        ? PricingFrequency.monthly
        : priceText.includes(perYearString)
        ? PricingFrequency.yearly
        : undefined;
};

export const scrape = async ({
    data,
    sortKey = 'yearlyPrice',
    sortAsc = false,
}: {
    data: string;
    sortKey?: keyof Package;
    sortAsc?: boolean;
}): Promise<Package[]> => {
    const $ = cheerio.load(data);

    const packages: Package[] = [];

    // Loop over each row.
    $('.row-subscriptions').each((_rowIndex, rowElement) => {
        const packageEls = $(rowElement).find('.package');

        // Loop over each package.
        packageEls.each((_index, packageEl) => {
            const optionTitle = $(packageEl).find('.header h3').text().trim();
            const description = $(packageEl).find('.package-description').text().trim();
            const price = $(packageEl).find('.package-price .price-big').text().trim();
            const priceData = $(packageEl).find('.package-price').text().trim();
            const discountElement = $(packageEl).find('.package-price p');

            // Set the frequency depending on which text the price div contains.
            const frequency = getFrequency(priceData);
            const discount = discountElement.length ? discountElement.text().trim() : undefined;

            // Build package object.
            const packageObject: Package = { optionTitle, description, price, frequency };

            // Get the yearly and monthly price as numbers. So we can sort the packages.
            if (frequency && frequency === PricingFrequency.monthly) {
                packageObject.yearlyPrice = convertPriceStringToNumber(price) * 12;
                packageObject.monthlyPrice = convertPriceStringToNumber(price);
            }

            if (frequency && frequency === PricingFrequency.yearly) {
                packageObject.yearlyPrice = convertPriceStringToNumber(price);
                packageObject.monthlyPrice = convertPriceStringToNumber(price) / 12;
            }

            // If there's a discount add it on.
            if (discount) {
                packageObject.discount = discount;
            }

            packages.push(packageObject);
        });
    });

    // Sort by the specified property and direction.
    const sortMultiplier = sortAsc ? -1 : 1;
    packages.sort((a, b) => (Number(b[sortKey] || 0) - Number(a[sortKey] || 0)) * sortMultiplier);

    return packages;
};

const init = async () => {
    // Return error if no url specified.
    const url = process.argv[2];
    if (!url) {
        console.error('Please provide a URL as an argument.');
        return;
    }
    const { data } = await axios.get(url);
    const packages = await scrape({ data });

    const jsonPackages = JSON.stringify(packages, null, 2);
    console.log(jsonPackages);
    return jsonPackages;
};

init();

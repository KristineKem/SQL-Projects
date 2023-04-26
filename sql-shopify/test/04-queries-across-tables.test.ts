import { Database } from "../src/database";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `select count(*) as count from pricing_plans pp 
        join apps_pricing_plans app on pp.id = app.pricing_plan_id
        join apps a on app.app_id = a.id
        where pp.price like 'Free%'`;
        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `select count(*) as count, c.title as category from categories c
        join apps_categories ac on c.id =  ac.category_id
        group by category
        order by count desc limit 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `select count(*) as count, pp.price, cast(replace(replace(replace(pp.price, ' one time charge', ''), '/month', ''), '$', '') as decimal) as casted_price from pricing_plans pp
        join apps_pricing_plans app on pp.id = app.pricing_plan_id
        where casted_price between 5 and 10
        group by casted_price
        order by count desc limit 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});
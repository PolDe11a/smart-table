export function initData(sourceData) {
  const getFullName = (person) => `${person.first_name} ${person.last_name}`;

  const sellers = Object.fromEntries(
    sourceData.sellers.map((seller) => [seller.id, getFullName(seller)]),
  );

  const customers = Object.fromEntries(
    sourceData.customers.map((customer) => [customer.id, getFullName(customer)]),
  );

  const mapRecord = (item) => ({
    id: item.receipt_id,
    date: item.date,
    seller: sellers[item.seller_id],
    customer: customers[item.customer_id],
    total: item.total_amount,
  });

  const getIndexes = async () => {
    return {
      sellers,
      customers,
    };
  };

  const getRecords = async (query = {}) => {
    let items = sourceData.purchase_records.map(mapRecord);

    if (query.search) {
      const search = query.search.toLowerCase();

      items = items.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search),
        ),
      );
    }

    Object.entries(query).forEach(([key, value]) => {
      if (!key.startsWith("filter[") || value === "") {
        return;
      }

      const field = key.slice(7, -1);

      if (field === "searchBySeller") {
        items = items.filter((item) => item.seller === value);
      }

      if (field === "totalFrom") {
        items = items.filter((item) => item.total >= Number(value));
      }

      if (field === "totalTo") {
        items = items.filter((item) => item.total <= Number(value));
      }
    });

    if (query.sort) {
      const [field, order] = query.sort.split(":");
      const direction = order === "desc" ? -1 : 1;

      items.sort((a, b) => {
        if (a[field] > b[field]) {
          return direction;
        }

        if (a[field] < b[field]) {
          return -direction;
        }

        return 0;
      });
    }

    const total = items.length;
    const limit = Number(query.limit ?? total);
    const page = Number(query.page ?? 1);

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      total,
      items: items.slice(start, end),
    };
  };

  return {
    getIndexes,
    getRecords,
  };
}
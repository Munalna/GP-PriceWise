import api from "./api";

export async function fetchSeasons() {
  const res = await api.get("/seasons");
  return res.data;
}

export async function createSeason({ name, startDate, endDate }) {
  const res = await api.post("/seasons", {
    season_name: name,
    start_date: startDate,
    end_date: endDate
  });

  return res.data;
}

export async function updateSeason(id, { name, startDate, endDate }) {
  const res = await api.patch(`/seasons/${id}`, {
    season_name: name,
    start_date: startDate,
    end_date: endDate
  });

  return res.data;
}

export async function deleteSeason(id) {
  const res = await api.delete(`/seasons/${id}`);
  return res.data;
}
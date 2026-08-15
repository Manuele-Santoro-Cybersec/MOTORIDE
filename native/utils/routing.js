export async function getRoute(coordinates, avoidMotorway = false) {
  try {
    if (!coordinates || coordinates.length < 2) {
      return { error: 'Not enough coordinates' };
    }
    
    // Mapbox expects lon,lat;lon,lat string
    const coordString = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';');
    
    let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${process.env.EXPO_PUBLIC_MAPBOX_KEY}`;
    
    if (avoidMotorway) {
      url += '&exclude=motorway';
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      return { error: data.message || 'Routing failed' };
    }
    
    const route = data.routes[0];
    
    // Convert Mapbox response from meters/seconds to miles/minutes
    const distanceMiles = (route.distance * 0.000621371).toFixed(1);
    const durationMinutes = Math.round(route.duration / 60);
    
    // Mapbox GeoJSON format returns coordinates as [longitude, latitude]
    const routeCoordinates = route.geometry.coordinates.map(c => ({
      latitude: c[1],
      longitude: c[0]
    }));
    
    return {
      distanceMiles,
      durationMinutes,
      coordinates: routeCoordinates
    };
  } catch (err) {
    return { error: 'Network error or invalid response' };
  }
}

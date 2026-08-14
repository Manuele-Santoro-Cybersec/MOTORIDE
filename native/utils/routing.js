export async function getRoute(coordinates) {
  try {
    if (!coordinates || coordinates.length < 2) {
      return { error: 'Not enough coordinates' };
    }
    
    const coordString = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';');
    
    // Note: The public OSRM server does not currently support the exclude=motorway parameter
    // for the driving profile. Passing it will result in an InvalidValue error.
    // We omit it for now to ensure routing works, pending a self-hosted instance.
    const url = `http://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      return { error: data.message || 'Routing failed' };
    }
    
    const route = data.routes[0];
    
    // Convert OSRM response from meters/seconds to miles/minutes
    const distanceMiles = (route.distance * 0.000621371).toFixed(1);
    const durationMinutes = Math.round(route.duration / 60);
    
    // OSRM GeoJSON format returns coordinates as [longitude, latitude]
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

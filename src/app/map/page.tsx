"use client";

import {useEffect, useRef, useState, Suspense} from 'react';
import mapboxgl from 'mapbox-gl';
import {Container, Box, CircularProgress} from '@mui/material';
import ChatBox from './ChatBox';
import type {Map as MapboxMap} from 'mapbox-gl';
import {useSearchParams} from "next/navigation";

interface PolygonGeometry {
    type: 'Polygon';
    coordinates: [number, number][][];  // Array of arrays of [longitude, latitude] pairs
}

interface GeoJSONFeature {
    type: 'Feature';
    geometry: PolygonGeometry;
    properties: Record<string, unknown>;
}

// Separate component for the map content that uses useSearchParams
const MapContent: React.FC = () => {
    const searchParams = useSearchParams();
    const chatUuid = searchParams.get('chatuuid');
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<MapboxMap | null>(null);
    const [pointOfInterestPolygon, setPointOfInterestPolygon] = useState<string | null>(null);

    // Watch for changes to pointOfInterestPolygon and update map center
    useEffect(() => {
        if (!map || !pointOfInterestPolygon) return;

        try {
            const polygonData = JSON.parse(pointOfInterestPolygon) as PolygonGeometry;
            console.log('Parsed polygon data:', polygonData);
            const geoJsonData: GeoJSONFeature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: polygonData.coordinates
                },
                properties: {}
            };

            if (geoJsonData.geometry.coordinates[0]?.length > 0) {
                // Calculate the center of the polygon
                const coordinates = polygonData.coordinates[0];
                const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                // Fly to the center of the bounds with some padding
                map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 16,
                    duration: 2000 // Animation duration in milliseconds
                });

                // Update the polygon source data
                const source = map.getSource('polygon') as mapboxgl.GeoJSONSource;
                source?.setData(geoJsonData);
            }
        } catch (error) {
            console.error('Error parsing or centering on polygon:', error);
        }
    }, [map, pointOfInterestPolygon]);

    useEffect(() => {
        let ignore = false;

        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
            if (!token) {
                return;
            }

            mapboxgl.accessToken = token;
            console.log('Mapbox token:', token);

            const initializeMap = ({
                                       setMap,
                                       mapContainer
                                   }: {
                setMap: (map: mapboxgl.Map) => void;
                mapContainer: React.RefObject<HTMLDivElement>;
            }) => {
                if (!mapContainer.current) return;

                const map = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: "mapbox://styles/mapbox/satellite-v9",
                    center: [115.8142283, -31.9810844],
                    zoom: 10,
                    minZoom: 4,
                });

                map.addControl(new mapboxgl.NavigationControl(), "bottom-left");

                map.on("load", () => {
                    if (!ignore) {
                        map.addSource('polygon', {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                geometry: {
                                    type: 'Polygon',
                                    coordinates: [[]]
                                },
                                properties: {}
                            }
                        });

                        // Make sure the source was added successfully
                        if (!map.getSource('polygon')) {
                            console.error('Failed to add polygon source');
                            return;
                        }

                        map.addLayer({
                            id: 'polygon-fill',
                            type: 'fill',
                            source: 'polygon',
                            paint: {
                                'fill-color': '#0080ff',
                                'fill-opacity': 0.3
                            }
                        });

                        map.addLayer({
                            id: 'polygon-outline',
                            type: 'line',
                            source: 'polygon',
                            paint: {
                                'line-color': '#0080ff',
                                'line-width': 2
                            }
                        });

                        setMap(map);
                        map.resize();
                    }
                });

                map.on('error', (e) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Mapbox error:', e);
                    }
                });
            };

            if (!map && mapContainer.current) {
                initializeMap({setMap, mapContainer});
            }

        } catch (err) {
            console.error('Error initializing map:', err);
        }

        return () => {
            ignore = true;
            if (map) {
                map.remove();
            }
        };
    }, [map]);

    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                height: '100vh',
                width: '100vw',
                position: 'relative',
                padding: 0,
                margin: 0,
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '100%',
                    width: '100%'
                }}
            >
                <div
                    ref={mapContainer}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%'
                    }}
                />
                <ChatBox
                    setPointOfInterestPolygon={setPointOfInterestPolygon}
                    chatUuid={chatUuid}
                />
            </Box>
        </Container>
    );
};

// Loading component
const LoadingMap: React.FC = () => (
    <Container
        maxWidth={false}
        disableGutters
        sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
    >
        <CircularProgress/>
    </Container>
);

// Main component wrapped with Suspense
const MapPage: React.FC = () => {
    return (
        <Suspense fallback={<LoadingMap/>}>
            <MapContent/>
        </Suspense>
    );
};

export default MapPage;
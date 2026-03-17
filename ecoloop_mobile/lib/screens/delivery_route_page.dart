import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

/// Simple OpenStreetMap geocoding helper (same idea as delivery_map_page).
Future<LatLng?> _geocodeAddress(String address) async {
  if (address.trim().isEmpty) return null;
  try {
    final uri = Uri.parse(
      'https://nominatim.openstreetmap.org/search'
      '?q=${Uri.encodeComponent('$address, Kerala, India')}'
      '&format=json'
      '&limit=1',
    );
    final response = await http.get(
      uri,
      headers: {'User-Agent': 'EcoloopDelivery/1.0'},
    );
    if (response.statusCode != 200) return null;
    final list = jsonDecode(response.body) as List<dynamic>?;
    if (list == null || list.isEmpty) return null;
    final item = list.first as Map<String, dynamic>;
    final lat = double.tryParse(item['lat']?.toString() ?? '');
    final lon = double.tryParse(item['lon']?.toString() ?? '');
    if (lat == null || lon == null) return null;
    return LatLng(lat, lon);
  } catch (_) {
    return null;
  }
}

class DeliveryRoutePage extends StatefulWidget {
  const DeliveryRoutePage({super.key, required this.delivery});

  final dynamic delivery;

  @override
  State<DeliveryRoutePage> createState() => _DeliveryRoutePageState();
}

class _DeliveryRoutePageState extends State<DeliveryRoutePage> {
  final MapController _mapController = MapController();

  LatLng? _start;
  LatLng? _end;
  List<LatLng> _routePoints = [];
  double? _distanceKm;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initRoute();
  }

  Future<void> _initRoute() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // 1. Get current location with permission handling
      final hasPermission = await _ensureLocationPermission();
      if (!hasPermission) {
        setState(() {
          _loading = false;
          _error = 'Location permission denied. Enable it to see the route.';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.best,
      );
      _start = LatLng(position.latitude, position.longitude);

      // 2. Build destination address from delivery
      final d = widget.delivery;
      final dynamic shipping = d['shippingAddress'];
      String address = '';

      if (shipping is String && shipping.trim().length > 5) {
        address = shipping;
      } else if (shipping is Map) {
        final parts = [
          shipping['address'],
          shipping['city'],
          shipping['state'],
          shipping['pincode'],
          d['userId']?['wardNumber'] != null ? 'Ward ${d['userId']?['wardNumber']}' : null,
        ].whereType<String>().where((s) => s.trim().isNotEmpty);
        address = parts.join(', ');
      }

      if (address.trim().isEmpty || address == 'No address provided') {
        address = (d['userId']?['address']?.toString() ?? '');
      }

      final dest = await _geocodeAddress(address);
      if (dest == null) {
        setState(() {
          _loading = false;
          _error = 'Could not locate the delivery address on the map.';
        });
        return;
      }
      _end = dest;

      // 3. Request driving route from OSRM (no API key, open data)
      final route = await _fetchRoute(_start!, _end!);
      if (!mounted) return;

      if (route == null) {
        setState(() {
          _loading = false;
          _error = 'Could not compute route.';
        });
        return;
      }

      setState(() {
        _routePoints = route.points;
        _distanceKm = route.distanceMeters / 1000.0;
        _loading = false;
      });

      // Center map between start and end
      final center = LatLng(
        (_start!.latitude + _end!.latitude) / 2,
        (_start!.longitude + _end!.longitude) / 2,
      );
      _mapController.move(center, 13);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Error loading route: $e';
      });
    }
  }

  Future<bool> _ensureLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return false;
    }
    return true;
  }

  Future<_RouteResult?> _fetchRoute(LatLng start, LatLng end) async {
    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/'
        '${start.longitude},${start.latitude};'
        '${end.longitude},${end.latitude}?overview=full&geometries=geojson',
      );
      final resp = await http.get(url);
      if (resp.statusCode != 200) return null;
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final routes = data['routes'] as List<dynamic>?;
      if (routes == null || routes.isEmpty) return null;
      final r = routes.first as Map<String, dynamic>;
      final geometry = r['geometry'] as Map<String, dynamic>?;
      final coords = geometry?['coordinates'] as List<dynamic>? ?? [];
      final points = coords
          .map((c) => LatLng(
                (c[1] as num).toDouble(),
                (c[0] as num).toDouble(),
              ))
          .toList();
      final distance = (r['distance'] as num?)?.toDouble() ?? 0.0;
      return _RouteResult(points: points, distanceMeters: distance);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderId = (widget.delivery['_id'] ?? '').toString();
    final shortId =
        orderId.length >= 6 ? orderId.substring(0, 6).toUpperCase() : orderId.toUpperCase();

    return Scaffold(
      appBar: AppBar(
        title: Text('Route to Delivery #$shortId'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
      ),
      body: _start == null || _end == null
          ? Center(
              child: _loading
                  ? const CircularProgressIndicator()
                  : Text(_error ?? 'Unable to load route'),
            )
          : Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _start!,
                    initialZoom: 13,
                    interactionOptions:
                        const InteractionOptions(flags: InteractiveFlag.all),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.ecoloop.mobile',
                    ),
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: _routePoints.isNotEmpty ? _routePoints : [_start!, _end!],
                          color: Colors.blue,
                          strokeWidth: 4,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _start!,
                          width: 40,
                          height: 40,
                          child: const Icon(Icons.my_location,
                              color: Colors.blue, size: 28),
                        ),
                        Marker(
                          point: _end!,
                          width: 40,
                          height: 40,
                          child:
                              const Icon(Icons.location_pin, color: Colors.red, size: 32),
                        ),
                      ],
                    ),
                  ],
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 24 + MediaQuery.of(context).padding.bottom,
                  child: Material(
                    elevation: 3,
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          const Icon(Icons.route, color: Colors.green),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _distanceKm != null
                                      ? 'Distance: ${_distanceKm!.toStringAsFixed(2)} km'
                                      : 'Distance: —',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Blue line shows the suggested route from your current location to the delivery address.',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.grey.shade700),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_loading)
                  const Positioned(
                    top: 16,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _RouteResult {
  _RouteResult({required this.points, required this.distanceMeters});

  final List<LatLng> points;
  final double distanceMeters;
}


import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

class AdminSmartBinPage extends StatefulWidget {
  const AdminSmartBinPage({super.key});

  @override
  State<AdminSmartBinPage> createState() => _AdminSmartBinPageState();
}

class _AdminSmartBinPageState extends State<AdminSmartBinPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  String? _errorMsg;
  
  Map<String, dynamic>? _latestData;
  List<dynamic> _historyData = [];
  Timer? _pollingTimer;

  // You can also change the URL to http://10.0.2.2:4321 for local android emulator testing
  // However we use Vercel because it is used globally in the app
  final String _iotUrl = '$apiBaseUrl/api/iot/latest-readings';

  @override
  void initState() {
    super.initState();
    _fetchGasData();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchGasData());
    _setupPushNotifications();
  }

  Future<void> _setupPushNotifications() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Request permissions required for iOS (No operation for Android)
    NotificationSettings settings = await messaging.requestPermission(
      alert: true, badge: true, sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      String? fcmToken = await messaging.getToken();
      
      if (fcmToken != null) {
        _sendTokenToBackend(fcmToken);
      }

      // Track Token refresh
      messaging.onTokenRefresh.listen((newToken) {
        _sendTokenToBackend(newToken);
      });

      // Show SnackBar on foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
             content: Text("⚠️ ${message.notification?.title}: ${message.notification?.body}"),
             backgroundColor: Colors.redAccent,
             duration: const Duration(seconds: 5),
          )
        );
      });
    }
  }

  Future<void> _sendTokenToBackend(String fcmToken) async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    
    if (userStr != null) {
      final user = jsonDecode(userStr);
      final userId = user['_id'];

      try {
        final uri = Uri.parse('http://127.0.0.1:4321/api/user/fcm-token/$userId');
        final r = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'fcmToken': fcmToken}),
        );
        print("FCM sync complete: ${r.statusCode}");
      } catch (e) {
        print("FCM sync error: $e");
      }
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchGasData() async {
    try {
      // Test URL handling if needed (Vercel vs Local)
      // For full safety, let's try the hosted server. 
      final response = await http.get(Uri.parse(_iotUrl)).timeout(const Duration(seconds: 10));
      
      // Fallback logic could be added if vercel doesn't host IoT
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          if (mounted) {
            setState(() {
              _latestData = data['latest'];
              _historyData = (data['history'] as List<dynamic>?)?.reversed.toList() ?? [];
              _isLoading = false;
              _errorMsg = null;
            });
          }
        } else {
          _setError("Invalid data format received.");
        }
      } else {
        // As a fallback for local testing, if Vercel server fails, you might point to localhost
        _fallbackLocalFetcher();
      }
    } catch (e) {
      _fallbackLocalFetcher();
    }
  }

  Future<void> _fallbackLocalFetcher() async {
    try {
      // We use your exact Wi-Fi IP address so your phone can reach it!
      final response = await http.get(Uri.parse('http://127.0.0.1:4321/api/iot/latest-readings')).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && mounted) {
           setState(() {
             _latestData = data['latest'];
             _historyData = (data['history'] as List<dynamic>?)?.reversed.toList() ?? [];
             _isLoading = false;
             _errorMsg = null;
           });
        }
      } else {
         _setError("Failed to fetch local IoT data");
      }
    } catch (e) {
      _setError("Unable to reach IoT endpoint: $e");
    }
  }

  void _setError(String msg) {
    if (mounted) {
      setState(() {
        _isLoading = false;
        _errorMsg = msg;
      });
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/login');
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'High':
        return Colors.redAccent;
      case 'Moderate':
        return Colors.orangeAccent;
      case 'Normal':
      default:
        return Colors.greenAccent.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        title: Text(
          'Smart Bin Monitor',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.blueAccent),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchGasData();
            },
          )
        ],
      ),
      drawer: _buildDrawer(),
      body: _isLoading && _latestData == null
          ? const Center(child: CircularProgressIndicator())
          : _errorMsg != null && _latestData == null
              ? Center(child: Text(_errorMsg!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _fetchGasData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildStatusCard(),
                        const SizedBox(height: 20),
                        _buildChartCard(),
                        const SizedBox(height: 20),
                        _buildHardwareDetails(),
                        const SizedBox(height: 20),
                        _buildHistoryLogs(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatusCard() {
    if (_latestData == null) return const SizedBox();

    double totalLevel = double.tryParse(_latestData!['gasLevel']?.toString() ?? '0') ?? 0;
    double co2 = totalLevel * 0.75;
    double methane = totalLevel * 0.25;
    String status = _latestData!['status'] ?? 'Unknown';
    Color statusColor = _getStatusColor(status);
    bool isHigh = status == 'High';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isHigh ? Colors.red.shade200 : Colors.grey.shade200),
        boxShadow: [
           BoxShadow(color: isHigh ? Colors.red.withOpacity(0.1) : Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4))
        ]
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('TOTAL GAS LEVEL', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500, letterSpacing: 1.5)),
              if (isHigh)
                 const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28)
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                totalLevel.toStringAsFixed(0),
                style: GoogleFonts.poppins(fontSize: 48, fontWeight: FontWeight.w800, color: isHigh ? Colors.red : Colors.black87),
              ),
              const SizedBox(width: 8),
              Text('PPM', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.5))
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(status == 'High' ? Icons.warning : Icons.check_circle, size: 14, color: statusColor),
                    const SizedBox(width: 6),
                    Text('Status: $status', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: statusColor)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CO2 (EST)', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.purple.shade300)),
                      Text('${co2.toStringAsFixed(1)} PPM', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.purple.shade700)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.lightBlue.shade50, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('METHANE (EST)', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.lightBlue.shade300)),
                      Text('${methane.toStringAsFixed(1)} PPM', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.lightBlue.shade700)),
                    ],
                  ),
                ),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildChartCard() {
    if (_historyData.isEmpty) return const SizedBox();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('REAL-TIME ANALYTICS', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500, letterSpacing: 1.5)),
          const SizedBox(height: 4),
          Text('Emission Levels', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 24),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: _getSpots(0.75),
                    isCurved: true,
                    color: Colors.purple.shade500,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: Colors.purple.shade500.withOpacity(0.1)),
                  ),
                  LineChartBarData(
                    spots: _getSpots(0.25),
                    isCurved: true,
                    color: Colors.lightBlue.shade500,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: Colors.lightBlue.shade500.withOpacity(0.1)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegend(Colors.purple.shade500, 'CO2'),
              const SizedBox(width: 16),
              _buildLegend(Colors.lightBlue.shade500, 'Methane'),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildLegend(Color color, String text) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(text, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
      ],
    );
  }

  List<FlSpot> _getSpots(double multiplier) {
    List<FlSpot> spots = [];
    for (int i = 0; i < _historyData.length; i++) {
      double gasLevel = double.tryParse(_historyData[i]['gasLevel']?.toString() ?? '0') ?? 0;
      spots.add(FlSpot(i.toDouble(), gasLevel * multiplier));
    }
    return spots;
  }

  Widget _buildHardwareDetails() {
    return Row(
      children: [
        Expanded(
          child: _infoCard(Icons.memory, 'CORE', 'ESP32 Module'),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _infoCard(Icons.thermostat, 'SENSOR', 'MQ135 Gas'),
        ),
      ],
    );
  }

  Widget _infoCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        children: [
           Icon(icon, color: Colors.blueGrey.shade400, size: 28),
           const SizedBox(height: 12),
           Text(label, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Colors.grey.shade400)),
           const SizedBox(height: 4),
           Text(value, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87), textAlign: TextAlign.center,),
        ],
      )
    );
  }

  Widget _buildHistoryLogs() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text('LOG TRACE', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500, letterSpacing: 1.5)),
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _historyData.take(10).length,
            separatorBuilder: (context, index) => Divider(color: Colors.grey.shade100, indent: 20, endIndent: 20),
            itemBuilder: (context, index) {
              final log = _historyData[index];
              final total = double.tryParse(log['gasLevel']?.toString() ?? '0') ?? 0;
              final co2 = total * 0.75;
              final ch4 = total * 0.25;
              final time = DateTime.tryParse(log['timestamp']?.toString() ?? '')?.toLocal();
              final timeStr = time != null ? '${time.hour}:${time.minute.toString().padLeft(2, '0')}:${time.second.toString().padLeft(2, '0')}' : '--:--:--';
              
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(timeStr, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
                    ),
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                           Text('CO2: ${co2.toStringAsFixed(1)} PPM', style: GoogleFonts.poppins(fontSize: 12, color: Colors.purple.shade600, fontWeight: FontWeight.bold)),
                           Text('CH4: ${ch4.toStringAsFixed(1)} PPM', style: GoogleFonts.poppins(fontSize: 12, color: Colors.lightBlue.shade600, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(log['status'] ?? '').withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8)
                      ),
                      child: Text(log['status'] ?? 'Unknown', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: _getStatusColor(log['status'] ?? ''))),
                    )
                  ],
                ),
              );
            },
          )
        ],
      )
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
            color: Colors.indigo.shade800,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('EcoLoop Admin', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Administrator Access', style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.9))),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.monitor, color: Colors.blue),
            title: const Text('Smart Bin Monitor'),
            selected: true,
            onTap: () => Navigator.pop(context),
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
            onTap: _logout,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

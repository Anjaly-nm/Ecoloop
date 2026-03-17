import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _prefKeyPrefix = 'delivery_availability_';

class WeeklyAvailabilityPage extends StatefulWidget {
  const WeeklyAvailabilityPage({super.key});

  @override
  State<WeeklyAvailabilityPage> createState() => _WeeklyAvailabilityPageState();
}

class _WeeklyAvailabilityPageState extends State<WeeklyAvailabilityPage> {
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  final Map<String, bool> _availability = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    for (final day in _days) {
      _availability[day] = prefs.getBool('$_prefKeyPrefix$day') ?? true;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _setDay(String day, bool value) async {
    setState(() => _availability[day] = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_prefKeyPrefix$day', value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Availability'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Set which days you are available for deliveries. This helps assign you routes on your available days.',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  ..._days.map((day) => Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: SwitchListTile(
                          title: Text(day),
                          subtitle: Text(_availability[day] == true ? 'Available' : 'Not available'),
                          value: _availability[day] ?? true,
                          onChanged: (v) => _setDay(day, v),
                          activeColor: Colors.green.shade700,
                        ),
                      )),
                  const SizedBox(height: 16),
                  Text(
                    'Your availability is saved on this device. Turn a day off when you cannot accept deliveries.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
    );
  }
}

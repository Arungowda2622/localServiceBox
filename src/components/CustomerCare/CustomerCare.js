import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import Header from '../header/Header'

const CustomerCare = ({ navigation }) => {

    const callNumber = (phone) => {
        Linking.openURL(`tel:${phone}`)
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f3f6fb' }}>

            <Header title={"Customer Support"} navigation={navigation} />

            <View style={styles.container}>

                {/* Support Icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🎧</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>24×7 Customer Support</Text>

                <Text style={styles.description}>
                    Our support team is always ready to help you with orders,
                    payments, delivery issues, or any other questions.
                    Feel free to contact us anytime.
                </Text>

                {/* Support Card */}
                <View style={styles.card}>

                    <Text style={styles.cardTitle}>Contact Our Support Team</Text>

                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => callNumber('6362775151')}
                    >
                        <Text style={styles.callText}>📞  6362775151</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => callNumber('7411550116')}
                    >
                        <Text style={styles.callText}>📞  7411550116</Text>
                    </TouchableOpacity>

                </View>

                {/* Footer */}
                <View style={styles.footerBox}>
                    <Text style={styles.footerText}>
                        🟢 Available 24 Hours • 7 Days a Week
                    </Text>
                </View>

            </View>

        </View>
    )
}

export default CustomerCare

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },

    iconContainer: {
        backgroundColor: '#e6f0ff',
        height: 90,
        width: 90,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },

    icon: {
        fontSize: 40
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10
    },

    description: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22
    },

    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333'
    },

    callButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        alignItems: 'center'
    },

    callText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },

    footerBox: {
        marginTop: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#e8f9f1',
        borderRadius: 20
    },

    footerText: {
        color: '#0a8f4c',
        fontWeight: '600'
    }

})
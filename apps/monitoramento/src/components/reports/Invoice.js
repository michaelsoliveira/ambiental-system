'use client'

import React from 'react';
import { Page, Document, Image, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer';
import InvoiceTitle from './InvoiceTitle'
import BillTo from './BillTo'
import InvoiceNo from './InvoiceNo'
import InvoiceItemsTable from './InvoiceItemsTable'
import InvoiceThankYouMsg from './InvoiceThankYouMsg'

import Roboto from '@/fonts/Roboto-Regular.ttf';
import RobotoItalic from '@/fonts/Roboto-Italic.ttf';
import RobotoBold from '@/fonts/Roboto-Bold.ttf';

Font.register({
    family: 'Roboto',
    fonts: [
      { src: Roboto },
      { src: RobotoItalic, fontStyle: 'italic' },
      { src: RobotoBold, fontStyle: 'bold' },
    ]
  });

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Roboto',
        fontSize: 11,
        paddingTop: 10,
        paddingLeft:60,
        paddingRight:60,
        lineHeight: 1.5,
        flexDirection: 'column',
    }, 
    logo: {
        width: 74,
        height: 66,
        marginLeft: 'auto',
        marginRight: 'auto'
    }
  });
  
  const Invoice = ({invoice}) => (
    <PDFViewer width="1000" height="800" className='app'>
        <Document>
            <Page size="A4" style={styles.page}>
                <Image style={styles.logo} src='/logo.png' alt='' />
                <InvoiceTitle title='Invoice'/>
                <InvoiceNo invoice={invoice}/>
                <BillTo invoice={invoice}/>
                <InvoiceItemsTable invoice={invoice} />
                <InvoiceThankYouMsg />
            </Page>
        </Document>
    </PDFViewer>
       
    );
  
  export default Invoice
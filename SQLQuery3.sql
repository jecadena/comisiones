SELECT ABS(DATEDIFF(DAY, h.CheckOutDate, h.CheckInDate))AS numeroDias,
		(ABS(DATEDIFF(DAY, h.CheckOutDate, h.CheckInDate)) * h.HotelPrice) AS sumaParcial,
		A.AgencyName, A.Sign, H.CheckInDate, H.CheckOutDate, H.ConfirmationCode, 
		H.HotelChainName, H.HotelName, H.HotelPrice, H.HotelPriceCurrency, H.fg_estado, H.CityName
    FROM HotelSegments AS h 
		INNER JOIN PNR AS a ON h.PnrId = a.PnrId
    WHERE h.ConfirmationCode != '' AND A.Sign LIKE '%PB';

